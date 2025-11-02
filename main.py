import uuid
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware # Crucial for front-end development

# --- 0. CONFIGURATION AND INITIALIZATION ---

# Security Setup
SECRET_KEY = "e3528e24b8de982dd911041b3c16c21d789176926a0496f22e6ba1d1ed77ed30"
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# MongoDB Setup
MONGO_URI = "mongodb://localhost:27017/" 
DB_NAME = "whiteboard_app_db" 
db_client: Optional[MongoClient] = None

app = FastAPI()

# Add CORS middleware to allow the HTML file to interact with the FastAPI server
# In production, restrict origins to only your domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. MONGODB CONNECTION AND MODELS ---

# Pydantic utility class to handle MongoDB's ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate),
            ])
        ])
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return str(v)
        raise ValueError("Invalid ObjectId")
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, handler):
        field_schema.update(type="string")
        return field_schema

class DrawingCommand(BaseModel):
    """A single line segment or drawing action sent over WebRTC."""
    x1: float
    y1: float
    x2: float
    y2: float
    color: str
    size: int # stroke width

class WhiteboardModel(BaseModel):
    """Schema for storing a Whiteboard session in MongoDB."""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    session_id: str = Field(...)
    creator_username: str = Field(...)
    canvas_state: List[DrawingCommand] = Field(default_factory=list)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }

@app.on_event("startup")
def startup_db_client():
    """Connects to MongoDB."""
    global db_client
    db_client = MongoClient(MONGO_URI)
    app.database = db_client[DB_NAME]
    print("Connected to the MongoDB database!")

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
    """Dependency function to validate JWT and return the authenticated username."""
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
    # NOTE: In a real app, you'd check a password against a hashed one stored in MongoDB.
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"username": user_in.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "username": user_in.username}


# --- 3. WHITEBOARD REST API ---

@app.post("/api/sessions", response_model=WhiteboardModel)
async def create_session(current_user: str = Depends(get_current_user)):
    """Creates a new whiteboard session and saves it to MongoDB."""
    session_id = str(uuid.uuid4()).split('-')[0].upper()
    
    new_board = WhiteboardModel(
        session_id=session_id,
        creator_username=current_user,
        canvas_state=[]
    )
    
    board_data = new_board.model_dump(by_alias=True, exclude_none=True)
    result = app.database["whiteboards"].insert_one(board_data)
    
    created_board = app.database["whiteboards"].find_one({"_id": result.inserted_id})
    
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
    # Convert Pydantic models back to simple dicts for MongoDB storage
    canvas_state_dicts = [cmd.model_dump() for cmd in state_data]

    update_result = app.database["whiteboards"].update_one(
        {"session_id": session_id},
        {"$set": {"canvas_state": canvas_state_dicts}}
    )

    if update_result.modified_count == 0 and update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Whiteboard session not found")
    # 204 No Content is the standard response for a successful update that returns no body.


# --- 4. WEBSOCKET SIGNALING SERVER ---

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
            # Receive WebRTC signaling messages (Offer, Answer, ICE Candidates)
            data = await websocket.receive_text()

            # Relay the signaling message to other peers in the room
            await manager.broadcast_signal(session_id, data, sender=websocket)

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        print(f"User disconnected from session: {session_id}")

# To run this server: uvicorn main:app --reload