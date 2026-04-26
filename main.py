import uuid
import jwt
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from pymongo import MongoClient
from bson import ObjectId
from pydantic import BaseModel, Field, BeforeValidator
from typing_extensions import Annotated
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os
from google.oauth2 import id_token
from google.auth.transport import requests

# --- 0. CONFIGURATION ---
SECRET_KEY = os.getenv("SECRET_KEY", "e3528e24b8de982dd911041b3c16c21d789176926a0496f22e6ba1d1ed77ed30")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "whiteboard_app_db")
GOOGLE_CLIENT_ID = "222718818435-k0is9elsnfejlblr43p44bt3i3fltk6f.apps.googleusercontent.com"

app = FastAPI(title="Professional Whiteboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. MODELS & DATABASE ---
def validate_objectid(v):
    if isinstance(v, ObjectId): return str(v)
    if not ObjectId.is_valid(v): raise ValueError('Invalid ObjectId')
    return str(v)

PyObjectId = Annotated[str, BeforeValidator(validate_objectid)]

class DrawingCommand(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    color: str
    size: int
    tool: str = 'pen'

class WhiteboardModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    session_id: str
    creator_username: str
    canvas_state: List[DrawingCommand] = []
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class GoogleAuthRequest(BaseModel):
    credential: str

class ProfileUpdateIn(BaseModel):
    job_title: str
    bio: Optional[str] = ""

@app.on_event("startup")
def startup():
    app.db_client = MongoClient(MONGO_URI)
    app.database = app.db_client[DB_NAME]

@app.on_event("shutdown")
def shutdown():
    app.db_client.close()

# --- 2. AUTHENTICATION ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=24)
    to_encode.update({"exp": expire, "sub": data["username"]})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    if token == "GUEST_TOKEN":
        return "guest_user"
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.post("/api/auth/google")
async def google_auth(auth_req: GoogleAuthRequest):
    try:
        idinfo = id_token.verify_oauth2_token(auth_req.credential, requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo['email']
        username = idinfo.get('name', email.split('@')[0])
        app.database["users"].update_one({"email": email}, {"$set": {"email": email, "username": username}}, upsert=True)
        token = create_access_token({"username": username, "email": email})
        return {"access_token": token, "token_type": "bearer", "username": username}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/users/profile")
async def update_profile(profile: ProfileUpdateIn, user: str = Depends(get_current_user)):
    app.database["users"].update_one({"username": user}, {"$set": {"job_title": profile.job_title, "bio": profile.bio}})
    return {"status": "success"}

# --- 3. SESSION API ---
@app.post("/api/sessions", response_model=WhiteboardModel)
async def create_session(user: str = Depends(get_current_user)):
    sid = str(uuid.uuid4()).split('-')[0].upper()
    board = WhiteboardModel(session_id=sid, creator_username=user)
    res = app.database["whiteboards"].insert_one(board.model_dump(by_alias=True, exclude_none=True))
    return WhiteboardModel.model_validate(app.database["whiteboards"].find_one({"_id": res.inserted_id}))

@app.get("/api/sessions/{session_id}", response_model=WhiteboardModel)
async def get_session(session_id: str, user: str = Depends(get_current_user)):
    board = app.database["whiteboards"].find_one({"session_id": session_id})
    if not board: raise HTTPException(status_code=404)
    return WhiteboardModel.model_validate(board)

@app.post("/api/sessions/{session_id}/save")
async def save_state(session_id: str, state: List[DrawingCommand], user: str = Depends(get_current_user)):
    app.database["whiteboards"].update_one({"session_id": session_id}, {"$set": {"canvas_state": [c.model_dump() for c in state]}})
    return {"status": "ok"}

# --- 4. WEBSOCKETS ---
class Manager:
    def __init__(self): self.cons: Dict[str, List[WebSocket]] = {}
    async def connect(self, sid, ws):
        await ws.accept()
        if sid not in self.cons: self.cons[sid] = []
        self.cons[sid].append(ws)
    def disconnect(self, sid, ws): self.cons[sid].remove(ws)
    async def broadcast(self, sid, msg, sender):
        for c in self.cons.get(sid, []):
            if c != sender: await c.send_text(msg)

manager = Manager()

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(ws: WebSocket, session_id: str):
    await manager.connect(session_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(session_id, data, sender=ws)
    except WebSocketDisconnect:
        manager.disconnect(session_id, ws)

@app.get("/")
async def index(): return FileResponse("index.html")

@app.get("/health")
async def health(): return {"status": "ok"}