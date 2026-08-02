# CollabCanvas Pro ✦

> A production-grade collaborative whiteboard platform built with React 19, TypeScript, FastAPI, Firebase, and WebRTC.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.11x-009688?logo=fastapi)
![Firebase](https://img.shields.io/badge/Firebase-11-FFCA28?logo=firebase)

---

## ✨ Features

| Area | Capabilities |
|------|-------------|
| **Canvas** | Freehand pen, shapes (rect/ellipse/diamond/star/triangle), lines, arrows, text, sticky notes, images, frames |
| **Interactions** | Multi-select, resize handles, rotation, drag-to-pan, pinch-to-zoom, snap-to-grid, smart guides |
| **Formatting** | Color picker, fill/stroke, opacity, shadow presets, border radius, stroke style (dashed/dotted/solid) |
| **Collaboration** | Real-time cursor presence via WebRTC data channels, signaling via FastAPI WebSocket |
| **Auth** | Firebase Google Sign-In **or** local mock mode (zero-config, uses localStorage) |
| **Board Mgmt** | Create/rename/star/delete boards, folder organization, version history snapshots |
| **Export** | PNG, SVG, PDF (wired via canvas API) |
| **AI-Ready** | Placeholder AI service module (`src/services/ai.ts`) ready to integrate Gemini / GPT |
| **Dark UI** | Glassmorphism panels, animated transitions, responsive layout, Framer Motion |

---

## Architecture

```
Browser (SPA)  React 19 + TypeScript + Vite
  Auth Page | Dashboard | Canvas Editor
  Zustand (authStore / canvasStore)
  Firebase SDK  |  Mock LocalStorage
       |
       | WebSocket
       |
FastAPI Signaling Server
  main.py - WebSocket /ws/{room_id}/{user_id}
  In-memory room registry + Firebase Firestore
```

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | >= 18 |
| Python | >= 3.10 |

### 1. Clone and install

```bash
git clone https://github.com/Uttham-412/Whiteboard.git
cd Whiteboard
npm install
pip install -r requirements.txt
```

### 2. Configure Firebase (optional)

```bash
cp .env.example .env.local
# Edit .env.local with your Firebase project credentials
```

Skip this step to run in **Guest Mode** — all data stored in localStorage.

### 3. Run development servers

```bash
# Terminal 1 — React SPA
npm run dev

# Terminal 2 — FastAPI signaling server
uvicorn main:app --reload --port 8000
```

Open http://localhost:5173

### 4. Production build

```bash
npm run build
uvicorn main:app --port 8000
```

---

## Firebase Setup

1. Go to Firebase Console, create a project
2. Add a Web App, copy the config
3. Enable Authentication -> Google Sign-In
4. Enable Firestore Database
5. Copy credentials into `.env.local`

---

## Tech Stack

- **Frontend**: React 19, TypeScript 5.8, Vite 8, Tailwind CSS v4
- **State**: Zustand 5
- **Animation**: Framer Motion 12
- **Backend**: FastAPI, WebSockets
- **Auth/DB**: Firebase 11 or localStorage mock
- **Icons**: Lucide React

---

## License

MIT (c) 2025 Uttham
