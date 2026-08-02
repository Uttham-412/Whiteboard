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

2. **RESEND_API_KEY** (Required for invitations):
   - Your Resend API key for email delivery

3. **FROM_EMAIL** (Optional, defaults to onboarding@resend.dev):
   - Sender email address

### 3. Important Notes

- Firebase Firestore is used for all persistence (Boards, Invitations, Users, Collaborators)
- The app will automatically serve frontend static files
- Render supports WebSockets for real-time whiteboard updates

### 4. Verifying Deployment

1. Visit your Render URL: `https://your-app-name.onrender.com`
2. Check logs in Render Dashboard for any errors
3. Test login → create session → draw → invite

### 5. Troubleshooting

- **502 Bad Gateway**: Check backend startup logs
- **Cannot connect**: Verify environment variables are set correctly
- **WebSocket errors**: Render supports WebSockets out-of-the-box

