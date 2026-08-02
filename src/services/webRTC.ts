export interface CursorPosition {
  userId: string;
  userName: string;
  userPhoto?: string;
  x: number;
  y: number;
  color: string;
}

export interface WebRTCMessage {
  type: 'offer' | 'answer' | 'candidate' | 'request_offer' | 'cursor' | 'draw' | 'chat' | 'presence' | 'join' | 'leave';
  payload?: any;
  candidate?: any;
  sdp?: any;
  userId?: string;
}

export class WebRTCManager {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private boardId: string;
  private userId: string;
  private userName: string;
  private userPhoto?: string;
  private userColor: string;

  public onCursorUpdate: (cursor: CursorPosition) => void = () => {};
  public onDrawCommand: (cmd: any) => void = () => {};
  public onChatMessage: (msg: any) => void = () => {};
  public onPresenceChange: (users: { uid: string; name: string }[]) => void = () => {};
  public onConnectionStateChange: (state: string) => void = () => {};

  constructor(boardId: string, userId: string, userName: string, userColor: string, userPhoto?: string) {
    this.boardId = boardId;
    this.userId = userId;
    this.userName = userName;
    this.userColor = userColor;
    this.userPhoto = userPhoto;
  }

  public connect() {
    // Read API URL strictly from environment (or default to FastAPI backend http://localhost:8000)
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const hostPath = apiUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}://${hostPath}/ws/${this.boardId}`;
    
    console.log(`[Realtime WebSockets] Connecting to backend signaling server: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.ws.onopen = () => {
      console.log(`[Realtime WebSockets] Connected to ${wsUrl}. Announcing presence...`);
      this.onConnectionStateChange('connected');
      this.sendSignalingMessage({
        type: 'join',
        userId: this.userId,
        payload: { userName: this.userName, userPhoto: this.userPhoto, color: this.userColor }
      });
      this.createOffer();
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.userId === this.userId) return; // Ignore self

        if (msg.type === 'offer') {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(msg.sdp || msg));
          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);
          this.sendSignalingMessage({
            type: 'answer',
            sdp: this.pc!.localDescription,
            userId: this.userId
          });
        } else if (msg.type === 'answer') {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(msg.sdp || msg));
        } else if (msg.type === 'candidate' && msg.candidate) {
          await this.pc!.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else if (msg.type === 'cursor') {
          this.onCursorUpdate(msg.payload);
        } else if (msg.type === 'draw') {
          this.onDrawCommand(msg.payload);
        } else if (msg.type === 'chat') {
          this.onChatMessage(msg.payload);
        } else if (msg.type === 'join' || msg.type === 'presence') {
          console.log(`[Realtime] Peer joined session:`, msg.userId);
        }
      } catch (err) {
        console.error("Signaling message handling error:", err);
      }
    };

    this.ws.onerror = (e) => {
      console.warn(`[Realtime WebSockets] Connection error at ${wsUrl}:`, e);
      this.onConnectionStateChange('error');
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'candidate',
          candidate: event.candidate,
          userId: this.userId
        });
      }
    };

    // Create Data Channel
    this.dc = this.pc.createDataChannel('draw');
    this.bindDataChannel(this.dc);

    // Capture incoming Data Channel
    this.pc.ondatachannel = (event) => {
      this.bindDataChannel(event.channel);
    };
  }

  private createOffer() {
    this.pc?.createOffer().then(o => {
      this.pc?.setLocalDescription(o);
      this.sendSignalingMessage({
        type: 'offer',
        sdp: o,
        userId: this.userId
      });
    });
  }

  private bindDataChannel(channel: RTCDataChannel) {
    this.dc = channel;
    
    channel.onopen = () => {
      console.log("[WebRTC] P2P DataChannel opened.");
      this.onConnectionStateChange('p2p-connected');
    };

    channel.onclose = () => {
      console.log("[WebRTC] P2P DataChannel closed.");
    };

    channel.onmessage = (event) => {
      try {
        const msg: WebRTCMessage = JSON.parse(event.data);
        if (msg.type === 'cursor') {
          this.onCursorUpdate(msg.payload);
        } else if (msg.type === 'draw') {
          this.onDrawCommand(msg.payload);
        } else if (msg.type === 'chat') {
          this.onChatMessage(msg.payload);
        }
      } catch (err) {
        console.error("Error processing P2P message:", err);
      }
    };
  }

  public broadcastCursor(x: number, y: number) {
    const payload: CursorPosition = {
      userId: this.userId,
      userName: this.userName,
      userPhoto: this.userPhoto,
      x,
      y,
      color: this.userColor
    };

    // Send via WebSocket backend relay
    this.sendSignalingMessage({ type: 'cursor', userId: this.userId, payload });
    // Also send via DataChannel if connected
    this.sendP2PMessage({ type: 'cursor', payload });
  }

  public broadcastDrawCommand(cmd: any) {
    this.sendSignalingMessage({ type: 'draw', userId: this.userId, payload: cmd });
    this.sendP2PMessage({ type: 'draw', payload: cmd });
  }

  public broadcastChat(text: string) {
    const payload = {
      userId: this.userId,
      userName: this.userName,
      text,
      timestamp: Date.now()
    };
    this.sendSignalingMessage({ type: 'chat', userId: this.userId, payload });
    this.sendP2PMessage({ type: 'chat', payload });
  }

  private sendP2PMessage(msg: WebRTCMessage) {
    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(JSON.stringify(msg));
      } catch (err) {
        // Fallback handled by WebSocket
      }
    }
  }

  private sendSignalingMessage(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (err) {
        console.error("Error sending signaling message:", err);
      }
    }
  }

  public disconnect() {
    this.sendSignalingMessage({ type: 'leave', userId: this.userId });
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }
}

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
