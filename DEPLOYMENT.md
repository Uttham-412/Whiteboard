# Render Deployment Guide

## Setup Instructions

### 1. Render Web Service Configuration

When creating a new Web Service on Render:

- **Name**: `whiteboard-app` (or your choice)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2. Environment Variables

Add these in Render Dashboard → Environment:

1. **SECRET_KEY** (Optional but recommended):
   - Generate: `python -c "import secrets; print(secrets.token_hex(32))"`
   - Or Render will auto-generate if using `render.yaml`

2. **MONGO_URI** (Required):
   - Your MongoDB Atlas connection string
   - Example: `mongodb+srv://user:password@cluster.mongodb.net/?appName=App`

3. **DB_NAME** (Optional, defaults to `whiteboard_app_db`):
   - Database name

### 3. Important Notes

- The app will automatically serve `index.html` at the root URL `/`
- Make sure `index.html` has the correct `DEPLOYED_HOST` set to your Render URL
- The Render URL will be something like: `your-app-name.onrender.com`
- Update `index.html` line 77: `const DEPLOYED_HOST = 'your-app-name.onrender.com';`

### 4. Verifying Deployment

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Check logs in Render Dashboard for any errors
3. Test login → create session → draw → save

### 5. Troubleshooting

- **502 Bad Gateway**: Check if MongoDB connection is working
- **Cannot connect**: Verify environment variables are set correctly
- **Static files not loading**: Ensure `index.html` is in the root directory
- **WebSocket errors**: Render supports WebSockets, but check firewall settings

