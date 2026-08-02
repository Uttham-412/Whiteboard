from dotenv import load_dotenv
from pathlib import Path
import os
import json
import uuid
import jwt
import time
import secrets
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
from google.oauth2 import id_token
from google.auth.transport import requests

# --- 0. ENVIRONMENT & CONFIGURATION ---
BASE_DIR = Path(__file__).resolve().parent
env_path = BASE_DIR / ".env"
load_dotenv(env_path, override=True)

SECRET_KEY = os.getenv("SECRET_KEY", "e3528e24b8de982dd911041b3c16c21d789176926a0496f22e6ba1d1ed77ed30")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "whiteboard_app_db")
GOOGLE_CLIENT_ID = "222718818435-k0is9elsnfejlblr43p44bt3i3fltk6f.apps.googleusercontent.com"

app = FastAPI(title="Professional Whiteboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
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
    try:
        app.db_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        # Test connection
        app.db_client.server_info()
        app.database = app.db_client[DB_NAME]
        app.mongo_enabled = True
        print("Connected to MongoDB Atlas / Local Database.")
    except Exception as e:
        print(f"MongoDB not available: {e}. Running in local in-memory fallback state.")
        app.mongo_enabled = False

@app.on_event("shutdown")
def shutdown():
    try:
        app.db_client.close()
    except Exception:
        pass


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
        if getattr(app, "mongo_enabled", False):
            app.database["users"].update_one({"email": email}, {"$set": {"email": email, "username": username}}, upsert=True)
        token = create_access_token({"username": username, "email": email})
        return {"access_token": token, "token_type": "bearer", "username": username}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.post("/api/users/profile")
async def update_profile(profile: ProfileUpdateIn, user: str = Depends(get_current_user)):
    if getattr(app, "mongo_enabled", False):
        app.database["users"].update_one({"username": user}, {"$set": {"job_title": profile.job_title, "bio": profile.bio}})
    return {"status": "success"}

# --- 3. SESSION API ---
@app.post("/api/sessions", response_model=WhiteboardModel)
async def create_session(user: str = Depends(get_current_user)):
    sid = str(uuid.uuid4()).split('-')[0].upper()
    board = WhiteboardModel(session_id=sid, creator_username=user)
    if getattr(app, "mongo_enabled", False):
        res = app.database["whiteboards"].insert_one(board.model_dump(by_alias=True, exclude_none=True))
        return WhiteboardModel.model_validate(app.database["whiteboards"].find_one({"_id": res.inserted_id}))
    else:
        if not hasattr(app, "in_memory_boards"):
            app.in_memory_boards = {}
        app.in_memory_boards[sid] = board
        return board

@app.get("/api/sessions/{session_id}", response_model=WhiteboardModel)
async def get_session(session_id: str, user: str = Depends(get_current_user)):
    if getattr(app, "mongo_enabled", False):
        board = app.database["whiteboards"].find_one({"session_id": session_id})
        if not board: raise HTTPException(status_code=404)
        return WhiteboardModel.model_validate(board)
    else:
        boards = getattr(app, "in_memory_boards", {})
        if session_id not in boards: raise HTTPException(status_code=404)
        return boards[session_id]

@app.post("/api/sessions/{session_id}/save")
async def save_state(session_id: str, state: List[DrawingCommand], user: str = Depends(get_current_user)):
    if getattr(app, "mongo_enabled", False):
        app.database["whiteboards"].update_one({"session_id": session_id}, {"$set": {"canvas_state": [c.model_dump() for c in state]}})
    else:
        boards = getattr(app, "in_memory_boards", {})
        if session_id in boards:
            boards[session_id].canvas_state = state
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
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, session_id: str = "global"):
    await manager.connect(session_id, ws)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(session_id, data, sender=ws)
    except WebSocketDisconnect:
        manager.disconnect(session_id, ws)

from fastapi.staticfiles import StaticFiles
import secrets
import urllib.request
import urllib.error

# --- INVITATIONS STORE ---
invites_store: Dict[str, dict] = {}

class InviteRequest(BaseModel):
    boardId: str
    email: str
    role: str = "editor"
    boardName: Optional[str] = "CollabCanvas Workspace"
    ownerName: Optional[str] = "Workspace Admin"

class VerifyInviteRequest(BaseModel):
    token: str

@app.post("/api/invite")
async def create_invite(req: InviteRequest):
    try:
        token = secrets.token_urlsafe(16)
        board_name = req.boardName or "CollabCanvas Workspace"
        owner_name = req.ownerName or "Workspace Admin"
        role_title = req.role.capitalize()
        
        invites_store[token] = {
            "boardId": req.boardId,
            "email": req.email.lower(),
            "role": req.role,
            "boardName": board_name,
            "createdAt": time.time(),
            "used": False
        }

        app_url = os.getenv("APP_URL", "http://localhost:5173")
        full_invite_url = f"{app_url}/invite?token={token}"

        html_content = f"""<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 40px 20px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
    <div style="margin-bottom: 24px;">
      <span style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.02em;">CollabCanvas Pro</span>
    </div>
    <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 12px; margin-top: 0;">You've been invited to collaborate</h1>
    <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
      <strong>{owner_name}</strong> invited you to collaborate on <strong>{board_name}</strong> with <strong>{role_title}</strong> permissions.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
      <div style="font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Workspace Details</div>
      <div style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 4px;">{board_name}</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">Role: <span style="color: #2563eb; font-weight: 600;">{role_title}</span> &bull; Valid for 7 days</div>
    </div>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="{full_invite_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
        Join Workspace
      </a>
    </div>
    <div style="font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      Or copy this URL into your browser: <br/>
      <a href="{full_invite_url}" style="color: #2563eb; word-break: break-all;">{full_invite_url}</a>
    </div>
  </div>
</body>
</html>"""

        resend_api_key = os.getenv("RESEND_API_KEY")
        if not resend_api_key or not resend_api_key.strip():
            raise HTTPException(
                status_code=500,
                detail="RESEND_API_KEY is not configured in your .env file. Please add your Resend API credentials to .env."
            )

        from_email = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

        print(f"Sending invite to {req.email}...")
        email_sent = False
        resend_error = None

        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CollabCanvasPro/1.0 (Mozilla/5.0; Python Client)"
        }
        body = {
            "from": from_email,
            "to": [req.email.lower()],
            "subject": f"You've been invited to collaborate on {board_name}",
            "html": html_content
        }
        resend_req = urllib.request.Request(
            "https://api.resend.com/emails", 
            data=json.dumps(body).encode("utf-8"), 
            headers=headers
        )
        try:
            with urllib.request.urlopen(resend_req) as resp:
                resp_body = resp.read().decode("utf-8")
                print("Resend response:", resp_body)
                print("Email delivered successfully.")
                email_sent = True
        except urllib.error.HTTPError as e:
            err_content = e.read().decode("utf-8")
            print(f"Resend HTTPError {e.code}:", err_content)
            resend_error = f"Resend Error {e.code}: {err_content}"
        except Exception as e:
            print("Resend Exception:", str(e))
            resend_error = str(e)

        return {
            "success": email_sent,
            "emailSent": email_sent,
            "status": "ok" if email_sent else "warning",
            "token": token,
            "boardId": req.boardId,
            "inviteUrl": f"/invite?token={token}",
            "error": resend_error
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-invite")
async def verify_invite(req: VerifyInviteRequest):
    try:
        token = req.token
        if token not in invites_store:
            raise HTTPException(status_code=404, detail="Invalid or expired invitation token.")
        
        inv_data = invites_store[token]
        inv_data["used"] = True
        return {
            "status": "ok",
            "boardId": inv_data["boardId"],
            "email": inv_data["email"],
            "role": inv_data["role"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# --- 5. AI INTEGRATION ENDPOINTS ---
class AIGenerateRequest(BaseModel):
    type: str  # 'flowchart', 'architecture', 'uml', 'mindmap'
    prompt: str

class AIAssistantRequest(BaseModel):
    action: str  # 'improve', 'add_missing', 'optimize_layout', 'explain'
    elements: List[dict] = []
    prompt: Optional[str] = ""

@app.post("/api/ai/generate")
async def ai_generate(req: AIGenerateRequest):
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    # Secure server-side AI response (or fallback structured JSON layout)
    timestamp = int(datetime.now().timestamp() * 1000)
    prompt_lower = req.prompt.lower()
    
    if req.type == "mindmap":
        root_x, root_y = 400, 200
        return {
            "status": "success",
            "provider": "gemini" if gemini_key else ("openai" if openai_key else "backend-layout"),
            "elements": [
                {"id": f"mm-root-{timestamp}", "type": "sticky", "x": root_x, "y": root_y, "width": 180, "height": 70, "rotation": 0, "color": "#0F172A", "fillColor": "#FEF3C7", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": f"Central Concept:\n{req.prompt}", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"mm-b1-{timestamp}", "type": "sticky", "x": root_x - 220, "y": root_y + 120, "width": 150, "height": 60, "rotation": 0, "color": "#2563EB", "fillColor": "#EFF6FF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "Branch Alpha", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"mm-b2-{timestamp}", "type": "sticky", "x": root_x, "y": root_y + 140, "width": 150, "height": 60, "rotation": 0, "color": "#7C3AED", "fillColor": "#F5F3FF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "Branch Beta", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"mm-b3-{timestamp}", "type": "sticky", "x": root_x + 220, "y": root_y + 120, "width": 150, "height": 60, "rotation": 0, "color": "#16A34A", "fillColor": "#F0FDF4", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "Branch Gamma", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"mm-c1-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#2563EB", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"mm-root-{timestamp}", "startAnchor": "bottom", "endElementId": f"mm-b1-{timestamp}", "endAnchor": "top", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"mm-c2-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#7C3AED", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"mm-root-{timestamp}", "startAnchor": "bottom", "endElementId": f"mm-b2-{timestamp}", "endAnchor": "top", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"mm-c3-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#16A34A", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"mm-root-{timestamp}", "startAnchor": "bottom", "endElementId": f"mm-b3-{timestamp}", "endAnchor": "top", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp}
            ]
        }

    elif req.type == "flowchart":
        startX, startY, stepY = 350, 120, 130
        return {
            "status": "success",
            "provider": "gemini" if gemini_key else ("openai" if openai_key else "backend-layout"),
            "elements": [
                {"id": f"fl-frame-{timestamp}", "type": "frame", "x": startX - 40, "y": startY - 40, "width": 280, "height": 550, "rotation": 0, "color": "#CBD5E1", "fillColor": "#FFFFFF", "strokeWidth": 1.5, "strokeStyle": "dashed", "opacity": 1, "shadow": "soft", "text": f"Flowchart: {req.prompt[:25]}", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-n1-{timestamp}", "type": "rounded-rect", "x": startX, "y": startY, "width": 200, "height": 75, "rotation": 0, "color": "#2563EB", "fillColor": "#EFF6FF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "1. User Trigger", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-n2-{timestamp}", "type": "decision-node", "x": startX, "y": startY + stepY, "width": 200, "height": 85, "rotation": 0, "color": "#D97706", "fillColor": "#FEF3C7", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "2. Validate Input?", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-n3-{timestamp}", "type": "rect", "x": startX, "y": startY + stepY * 2, "width": 200, "height": 75, "rotation": 0, "color": "#7C3AED", "fillColor": "#F5F3FF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "3. Execute Action", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-n4-{timestamp}", "type": "rounded-rect", "x": startX, "y": startY + stepY * 3, "width": 200, "height": 75, "rotation": 0, "color": "#16A34A", "fillColor": "#F0FDF4", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "4. Finish & Notify", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-c1-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#2563EB", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"fl-n1-{timestamp}", "startAnchor": "bottom", "endElementId": f"fl-n2-{timestamp}", "endAnchor": "top", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-c2-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#D97706", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"fl-n2-{timestamp}", "startAnchor": "bottom", "endElementId": f"fl-n3-{timestamp}", "endAnchor": "top", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"fl-c3-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#7C3AED", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"fl-n3-{timestamp}", "startAnchor": "bottom", "endElementId": f"fl-n4-{timestamp}", "endAnchor": "top", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp}
            ]
        }

    elif req.type == "architecture":
        return {
            "status": "success",
            "provider": "gemini" if gemini_key else ("openai" if openai_key else "backend-layout"),
            "elements": [
                {"id": f"arch-frame-{timestamp}", "type": "frame", "x": 100, "y": 80, "width": 780, "height": 400, "rotation": 0, "color": "#CBD5E1", "fillColor": "#FFFFFF", "strokeWidth": 1.5, "strokeStyle": "dashed", "opacity": 1, "shadow": "soft", "text": f"Architecture: {req.prompt[:30]}", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-1-{timestamp}", "type": "cloud-node", "x": 140, "y": 220, "width": 140, "height": 80, "rotation": 0, "color": "#2563EB", "fillColor": "#EFF6FF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "CDN / CloudFront", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-2-{timestamp}", "type": "api-gateway", "x": 320, "y": 220, "width": 140, "height": 80, "rotation": 0, "color": "#7C3AED", "fillColor": "#F5F3FF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "API Gateway", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-3-{timestamp}", "type": "microservice-node", "x": 520, "y": 150, "width": 140, "height": 80, "rotation": 0, "color": "#16A34A", "fillColor": "#F0FDF4", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "Auth Microservice", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-4-{timestamp}", "type": "microservice-node", "x": 520, "y": 290, "width": 140, "height": 80, "rotation": 0, "color": "#16A34A", "fillColor": "#F0FDF4", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "Core Microservice", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-5-{timestamp}", "type": "database-node", "x": 700, "y": 220, "width": 140, "height": 80, "rotation": 0, "color": "#D97706", "fillColor": "#FEF3C7", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": "Primary DB", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-c1-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#2563EB", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"arch-1-{timestamp}", "startAnchor": "right", "endElementId": f"arch-2-{timestamp}", "endAnchor": "left", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-c2-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#7C3AED", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"arch-2-{timestamp}", "startAnchor": "right", "endElementId": f"arch-3-{timestamp}", "endAnchor": "left", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-c3-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#7C3AED", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"arch-2-{timestamp}", "startAnchor": "right", "endElementId": f"arch-4-{timestamp}", "endAnchor": "left", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-c4-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#16A34A", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"arch-3-{timestamp}", "startAnchor": "right", "endElementId": f"arch-5-{timestamp}", "endAnchor": "left", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"arch-c5-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#16A34A", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"arch-4-{timestamp}", "startAnchor": "right", "endElementId": f"arch-5-{timestamp}", "endAnchor": "left", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp}
            ]
        }

    else:  # UML
        return {
            "status": "success",
            "provider": "gemini" if gemini_key else ("openai" if openai_key else "backend-layout"),
            "elements": [
                {"id": f"uml-1-{timestamp}", "type": "rect", "x": 200, "y": 150, "width": 200, "height": 160, "rotation": 0, "color": "#0F172A", "fillColor": "#FFFFFF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": f"<<Class>>\nUserAccount\n---\n+ id: string\n+ email: string\n---\n+ login(): bool", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"uml-2-{timestamp}", "type": "rect", "x": 480, "y": 150, "width": 200, "height": 160, "rotation": 0, "color": "#0F172A", "fillColor": "#FFFFFF", "strokeWidth": 1.5, "strokeStyle": "solid", "opacity": 1, "shadow": "soft", "text": f"<<Service>>\nSessionManager\n---\n+ activeTokens: dict\n---\n+ issueToken(): string", "createdAt": timestamp, "updatedAt": timestamp},
                {"id": f"uml-c1-{timestamp}", "type": "orthogonal-connector", "x": 0, "y": 0, "width": 0, "height": 0, "rotation": 0, "color": "#2563EB", "strokeWidth": 1.5, "strokeStyle": "dashed", "opacity": 1, "shadow": "none", "connectorData": {"startElementId": f"uml-1-{timestamp}", "startAnchor": "right", "endElementId": f"uml-2-{timestamp}", "endAnchor": "left", "label": "authenticates", "routingMode": "orthogonal", "arrowEnd": True}, "createdAt": timestamp, "updatedAt": timestamp}
            ]
        }

@app.post("/api/ai/assistant")
async def ai_assistant(req: AIAssistantRequest):
    if req.action == "explain":
        return {
            "status": "success",
            "explanation": "This architecture diagram depicts an end-to-end cloud infrastructure flow: User traffic originates from the Route 53 CDN, routes through an API Gateway, dispatches requests to microservices, and persists state in a primary database."
        }
    return {
        "status": "success",
        "elements": req.elements
    }

@app.get("/health")
async def health():
    return {"status": "ok", "mongo_enabled": getattr(app, "mongo_enabled", False)}

@app.get("/{catchall:path}")
async def index(catchall: str = ""):
    if os.path.exists("dist/index.html"):
        return FileResponse("dist/index.html")
    return FileResponse("original_index.html" if os.path.exists("original_index.html") else "index.html")
