export interface CursorPosition {
  userId: string;
  userName: string;
  userPhoto?: string;
  x: number;
  y: number;
  color: string;
}

export interface WebRTCMessage {
  type: 'cursor' | 'draw' | 'chat' | 'presence';
  payload: any;
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
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss' : 'ws';
    // Match deployed host or local host
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/ws/${this.boardId}`;
    
    console.log(`Connecting to signaling server: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    this.ws.onopen = () => {
      console.log("WebSocket connected. Requesting connection offer...");
      this.sendSignalingMessage({ type: 'request_offer', userId: this.userId });
      this.onConnectionStateChange('connecting');
    };

    this.ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'offer') {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(msg));
          const answer = await this.pc!.createAnswer();
          await this.pc!.setLocalDescription(answer);
          this.ws?.send(JSON.stringify(this.pc!.localDescription));
        } else if (msg.type === 'answer') {
          await this.pc!.setRemoteDescription(new RTCSessionDescription(msg));
        } else if (msg.type === 'candidate') {
          await this.pc!.addIceCandidate(new RTCIceCandidate(msg.candidate));
        } else if (msg.type === 'request_offer') {
          this.createOffer();
        }
      } catch (err) {
        console.error("Signaling message handling error:", err);
      }
    };

    this.ws.onerror = (e) => {
      console.warn("WebSocket signaling error (backend might be offline). P2P connections skipped.", e);
      this.onConnectionStateChange('offline-sandbox');
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
      this.ws?.send(JSON.stringify(o));
    });
  }

  private bindDataChannel(channel: RTCDataChannel) {
    this.dc = channel;
    
    channel.onopen = () => {
      console.log("WebRTC P2P DataChannel opened.");
      this.onConnectionStateChange('connected');
      // Send initial presence hello
      this.sendPresence('join');
    };

    channel.onclose = () => {
      console.log("WebRTC P2P DataChannel closed.");
      this.onConnectionStateChange('disconnected');
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
    this.sendP2PMessage({
      type: 'cursor',
      payload: {
        userId: this.userId,
        userName: this.userName,
        userPhoto: this.userPhoto,
        x,
        y,
        color: this.userColor
      }
    });
  }

  public broadcastDrawCommand(cmd: any) {
    this.sendP2PMessage({
      type: 'draw',
      payload: cmd
    });
  }

  public broadcastChat(text: string) {
    this.sendP2PMessage({
      type: 'chat',
      payload: {
        userId: this.userId,
        userName: this.userName,
        text,
        timestamp: Date.now()
      }
    });
  }

  private sendP2PMessage(msg: WebRTCMessage) {
    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(JSON.stringify(msg));
      } catch (err) {
        console.error("Error sending WebRTC P2P message:", err);
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

  private sendPresence(action: 'join' | 'leave') {
    this.sendP2PMessage({
      type: 'presence',
      payload: {
        userId: this.userId,
        userName: this.userName,
        action
      }
    });
  }

  public disconnect() {
    this.sendPresence('leave');
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
