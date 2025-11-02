import uuid
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field # Removed field_validator, model_validator as they are not used
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
import os

# --- NEW IMPORTS FOR PYDANTIC V2 FIX ---
from pydantic import BeforeValidator 
from typing_extensions import Annotated 
# ---------------------------------------

# --- 0. CONFIGURATION AND INITIALIZATION ---

# SECURITY: Use environment variables in a production deployment
SECRET_KEY = os.getenv("SECRET_KEY", "e3528e24b8de982dd911041b3c16c21d789176926a0496f22e6ba1d1ed77ed30")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# MONGODB ATLAS URI:
MONGO_URI = "mongodb+srv://fastapi_user:ZemQrtyHyyS6hMiL@whiteboardcluster.wajjxyr.mongodb.net/?appName=WhiteboardCluster" 
DB_NAME = "whiteboard_app_db" 
db_client: Optional[MongoClient] = None

app = FastAPI()

# CORS: Allows any origin to access the API (essential for development and deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. MONGODB CONNECTION AND MODELS ---

# --- PYDANTIC V2 FIX: Custom type for ObjectId handling ---
def validate_objectid(v):
    """
    Validator function to ensure the value is a valid ObjectId structure (or already an ObjectId).
    """
    if isinstance(v, ObjectId):
        return str(v)
    if not ObjectId.is_valid(v):
        raise ValueError('Invalid ObjectId format')
    return str(v)

# Define the PyObjectId custom type using the validator
PyObjectId = Annotated[str, BeforeValidator(validate_objectid)]
# ---------------------------------------

class DrawingCommand(BaseModel):
    """Data model for a single collaborative drawing action."""
    x1: float
    y1: float
    x2: float
    y2: float
    color: str
    size: int
    tool: str = Field(default='pen') # Supports 'pen', 'eraser'

class WhiteboardModel(BaseModel):
    """Schema for storing a Whiteboard session in MongoDB."""
    # This now uses the PyObjectId defined above
    id: Optional[PyObjectId] = Field(alias="_id", default=None) 
    session_id: str = Field(...)
    creator_username: str = Field(...)
    canvas_state: List[DrawingCommand] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        # Ensure MongoDB ObjectId is converted to string for JSON output
        json_encoders = {ObjectId: str}

@app.on_event("startup")
def startup_db_client():
    """Connects to MongoDB."""
    global db_client
    try:
        db_client = MongoClient(MONGO_URI)
        # The database is created on first use, so we just reference it here
        app.database = db_client[DB_NAME] 
        print("Connected to the MongoDB database!")
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        # Optionally exit or handle failure

@app.on_event("shutdown")
def shutdown_db_client():
    """Closes the MongoDB connection."""
    if db_client:
        db_client.close()
        print("Closed MongoDB connection.")

# --- 2. JWT AUTHENTICATION LOGIC ---

class UserIn(BaseModel):
    username: str

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode.update({"exp": expire, "sub": data["username"]})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Dependency function to validate JWT."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

@app.post("/api/login")
async def login_for_access_token(user_in: UserIn):
    """Generates a JWT token for a given username."""
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"username": user_in.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "username": user_in.username}


# --- 3. WHITEBOARD REST API ---

@app.post("/api/sessions", response_model=WhiteboardModel)
async def create_session(current_user: str = Depends(get_current_user)):
    """Creates a new whiteboard session."""
    session_id = str(uuid.uuid4()).split('-')[0].upper()
    
    new_board = WhiteboardModel(
        session_id=session_id,
        creator_username=current_user,
        canvas_state=[]
    )
    
    # Use model_dump(by_alias=True) for MongoDB compatibility
    board_data = new_board.model_dump(by_alias=True, exclude_none=True)
    result = app.database["whiteboards"].insert_one(board_data)
    
    # Retrieve the new document to get the MongoDB generated _id
    created_board = app.database["whiteboards"].find_one({"_id": result.inserted_id})
    
    # This now uses the fixed Pydantic validation:
    return WhiteboardModel.model_validate(created_board)

@app.get("/api/sessions/{session_id}", response_model=WhiteboardModel)
async def get_session(session_id: str, current_user: str = Depends(get_current_user)):
    """Retrieves an existing whiteboard session state from MongoDB."""
    board_doc = app.database["whiteboards"].find_one({"session_id": session_id})
    
    if board_doc is None:
        raise HTTPException(status_code=404, detail="Whiteboard session not found")
    
    return WhiteboardModel.model_validate(board_doc)

@app.post("/api/sessions/{session_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def save_canvas_state(
    session_id: str,
    state_data: List[DrawingCommand],
    current_user: str = Depends(get_current_user)
):
    """Saves the current list of drawing commands to MongoDB."""
    try:
        print(f"Saving canvas state for session {session_id} by user {current_user}")
        print(f"Received {len(state_data)} drawing commands")
        
        # Convert Pydantic models to dictionaries for MongoDB
        canvas_state_dicts = [cmd.model_dump() for cmd in state_data]
        
        # Update the session in MongoDB
        update_result = app.database["whiteboards"].update_one(
            {"session_id": session_id},
            {"$set": {"canvas_state": canvas_state_dicts}}
        )

        if update_result.modified_count == 0 and update_result.matched_count == 0:
            print(f"Session {session_id} not found in database")
            raise HTTPException(status_code=404, detail="Whiteboard session not found")
        
        print(f"Successfully saved canvas state for session {session_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error saving canvas state: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# --- 4. WEBSOCKET SIGNALING SERVER (ConnectionManager remains unchanged) ---

class ConnectionManager:
    """Manages active WebSocket connections for WebRTC signaling."""
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)

    async def broadcast_signal(self, session_id: str, message: str, sender: WebSocket):
        for connection in self.active_connections.get(session_id, []):
            if connection != sender:
                await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    print(f"User connected to session: {session_id}")

    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast_signal(session_id, data, sender=websocket)

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        print(f"User disconnected from session: {session_id}")