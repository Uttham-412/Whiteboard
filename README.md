# 🎨 WebRTC Collaborative Whiteboard App

This is a real-time, collaborative whiteboard application built with FastAPI on the backend for API and WebSocket signaling, and pure HTML/JavaScript on the frontend for drawing and WebRTC communication.

Users can create and join collaborative sessions, draw in real-time with other peers, and persist the canvas state to a MongoDB database.

## ✨ Features

* **Real-time Collaboration:** Utilizes WebSockets for WebRTC signaling to enable peer-to-peer, low-latency drawing synchronization.
* **Drawing Persistence:** Save and load the entire canvas history (a list of drawing commands) to/from MongoDB.
* **Authentication:** JWT-based login mechanism for user identification.
* **Advanced Tools:**
    * Drawing Tools: Pen, Eraser, Text, Eyedropper, and Zoom.
    * Brush Styles: Solid, Dashed, Dotted, and Wavy.
    * Shape Tools: Circle, Square, Triangle, Arrow, Speech Bubble, and Star.
    * Customization: Adjustable line `size` and `opacity`, and a full color palette/picker.

## 🛠️ Tech Stack

### Backend (Python/FastAPI)

* **Python:** 3.11.5 (as specified in `render.yaml`)
* **Web Framework:** `fastapi==0.120.4`
* **ASGI Server:** `uvicorn==0.38.0`
* **Database Driver:** `pymongo==4.15.3` (for MongoDB Atlas)
* **Authentication:** `PyJWT==2.10.1`
* **Data Validation:** `pydantic==2.12.3`
* **Real-time:** `websockets==12.0`

### Frontend (Browser)

* **HTML, CSS, JavaScript**
* **Canvas API** for drawing
* **WebSockets** for signaling
* **WebRTC** for P2P data transfer

## 🚀 Installation and Local Run

### Prerequisites

1.  Python 3.x
2.  MongoDB Atlas connection string

### Steps

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd <repo-name>
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Set Environment Variables:**
    The application requires the following environment variables. You can set them directly in your shell or use a `.env` file (which is ignored by Git):

    | Variable | Description | Example |
    | :--- | :--- | :--- |
    | `SECRET_KEY` | JWT signing secret (recommended to generate a secure one). | `python -c "import secrets; print(secrets.token_hex(32))"` |
    | `MONGO_URI` | Your MongoDB Atlas connection string (required). | `mongodb+srv://user:password@cluster.mongodb.net/?appName=App` |
    | `DB_NAME` | Database name (defaults to `whiteboard_app_db`). | `whiteboard_app_db` |

4.  **Run the application:**
    Use the `uvicorn` command or the provided `start.sh` script:
    ```bash
    # Using start.sh
    ./start.sh
    # or using uvicorn directly
    uvicorn main:app --host 0.0.0.0 --port 8000
    ```
    The application will serve the backend API and the frontend `index.html` at `http://localhost:8000/`.

## ☁️ Deployment (Render)

This project includes configuration files for easy deployment to [Render](https://render.com/).

### `render.yaml` (Infrastructure as Code)

The `render.yaml` file defines the Web Service:
* **Type:** `web`
* **Name:** `whiteboard-app`
* **Environment:** `python`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables:** It automatically generates `SECRET_KEY` and sets `DB_NAME` to `whiteboard_app_db`. You must manually set the `MONGO_URI` in the Render Dashboard.

### Post-Deployment Notes

1.  **Check the Start Command:** The explicit start command is `uvicorn main:app --host 0.0.0.0 --port $PORT`.
2.  **Update Frontend Host:** After deployment, you must update the `DEPLOYED_HOST` variable in `index.html` (around line 77) to your live Render URL (e.g., `your-app-name.onrender.com`) to ensure WebSockets connect correctly.

### Troubleshooting

* **502 Bad Gateway:** Check if the MongoDB connection is working.
* **Cannot connect:** Verify all environment variables, especially `MONGO_URI`, are set correctly.
* **WebSocket errors:** Render supports WebSockets, but check firewall settings.
* **Health Check:** The application exposes a health check endpoint at `/health`.
