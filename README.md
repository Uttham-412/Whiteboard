# 🎨 Real-Time Collaborative Whiteboard App with FastAPI and WebRTC

This is a real-time, collaborative whiteboard application built with Python's FastAPI framework for the API and WebSocket signaling, and pure HTML/JavaScript on the frontend utilizing WebRTC for peer-to-peer data transfer.

Users can create and join shared whiteboard sessions, draw in real-time with collaborators, and persist the canvas state to a MongoDB database.

## ✨ Key Features

* **Real-time Collaboration (WebRTC):** Uses WebSockets for WebRTC signaling to establish peer-to-peer data channels for low-latency, real-time drawing synchronization between users.
* **Drawing Persistence:** Save and load the entire canvas history (a list of structured `DrawingCommand` objects) to and from MongoDB via a dedicated API endpoint.
* **Authentication:** JWT-based login mechanism to secure session creation and access.
* **Advanced Drawing Tools:**
    * **Tools:** Pen, Eraser, Text, Eyedropper, and Zoom.
    * **Styles:** Supports Solid, Dashed, Dotted, and Wavy brush styles.
    * **Shapes:** Includes dedicated tools for Circle, Square, Triangle, Arrow, Speech Bubble, and Star.

## 🛠️ Tech Stack

### Backend (Python/FastAPI)

* **Python:** 3.11.5 (specified in `render.yaml`)
* **Web Framework:** `fastapi==0.120.4`
* **ASGI Server:** `uvicorn==0.38.0`
* **Database Driver:** `pymongo==4.15.3` (for MongoDB Atlas)
* **Authentication:** `PyJWT==2.10.1`
* **Real-time:** `websockets==12.0`

### Frontend (Browser)

* **HTML5 Canvas API**
* **WebRTC Data Channels**
* **Vanilla JavaScript**

## 🚀 Local Installation and Run

### Prerequisites

1.  Python 3.9+
2.  A MongoDB Atlas connection string (`MONGO_URI`).

### Steps

1.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

2.  **Set Environment Variables:**
    The application requires the following variables to connect to MongoDB and secure JWTs.

    | Variable | Description |
    | :--- | :--- |
    | `SECRET_KEY` | JWT signing secret (e.g., generated with `secrets.token_hex(32)`). |
    | `MONGO_URI` | Your MongoDB Atlas connection string. |
    | `DB_NAME` | Database name (defaults to `whiteboard_app_db`). |

3.  **Run the application:**
    Use the provided startup script or run `uvicorn` directly. If the `uvicorn` command is not found in your terminal, use the `python -m` prefix:

    ```bash
    # Standard run (with hot-reload for development)
    uvicorn main:app --reload --host 127.0.0.1 --port 8000

    # Fallback if uvicorn is not in PATH
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```
    The application will be accessible at `http://localhost:8000/`.

### 👥 Using the App
- **Guest Access**: You can click "Continue as Guest" to quickly enter the workspace without logging in.
- **Collaboration**: Create a session, copy the **Workspace ID** from the bottom bar, and share it with others to draw together in real-time.

## ☁️ Deployment (Render)

The project includes configuration files (`render.yaml` and `start.sh`) for straightforward deployment on a cloud platform like Render.

### Render Configuration Summary

* **Environment:** Python 3
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

The application uses `location.host` to dynamically connect to the WebSocket server, so no manual URL updates are required in the code after deployment. Just ensure your `MONGO_URI` is correctly set in the Render environment variables.
