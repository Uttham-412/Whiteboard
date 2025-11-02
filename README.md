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
    Use the provided startup script or run `uvicorn` directly:

    ```bash
    # Using the start.sh script
    ./start.sh
    # or using uvicorn directly
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```
    The application will be accessible at `http://localhost:8000/`.

## ☁️ Deployment (Render)

The project includes configuration files (`render.yaml` and `start.sh`) for straightforward deployment on a cloud platform like Render.

### Render Configuration Summary

* **Environment:** Python 3
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Critical Post-Deployment Step

The frontend JavaScript needs to know the deployed URL for WebSocket signaling. After deploying, you **must** update the `DEPLOYED_HOST` constant in `index.html` (around line 77) to your live service URL:

```javascript
// index.html <script>
const DEPLOYED_HOST = 'your-app-name.onrender.com'; // <-- UPDATE THIS
// ... the rest of your code ...
