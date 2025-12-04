# 🔐 Environment Variables Reference

This document lists all environment variables needed for deployment.

---

## Backend Environment Variables

### Required for Production

| Variable | Example | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `production` | Flask environment mode |
| `DEBUG` | `False` | Enable/disable debug mode |
| `HOST` | `0.0.0.0` | Server host (use 0.0.0.0 for cloud) |
| `PORT` | `5000` | Server port (auto-set by Railway/Render) |
| `SECRET_KEY` | `your-random-secret-key-here` | Flask secret key (generate random) |
| `CORS_ORIGINS` | `https://your-app.vercel.app` | Allowed frontend origins (comma-separated) |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `model/model.h5` | Path to TensorFlow model |
| `UPLOAD_FOLDER` | `uploads` | Folder for temporary uploads |
| `MAX_CONTENT_LENGTH` | `16777216` | Max file size in bytes (16MB) |
| `ALLOWED_EXTENSIONS` | `png,jpg,jpeg,gif,webp` | Allowed file extensions |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FILE` | `logs/app.log` | Log file path |

---

## Frontend Environment Variables

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `https://your-app.railway.app` | Backend API URL (public) |
| `BACKEND_URL` | `https://your-app.railway.app` | Backend API URL (server-side) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIza...` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-app.firebaseapp.com` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-app.appspot.com` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123:web:abc` | Firebase app ID |

---

## How to Generate SECRET_KEY

### Option 1: Python
```python
import secrets
print(secrets.token_hex(32))
```

### Option 2: Online
Use a secure random string generator:
- https://randomkeygen.com/
- Generate a 64-character hex string

### Option 3: OpenSSL
```bash
openssl rand -hex 32
```

---

## Setting Variables in Each Platform

### Railway
1. Go to your project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable

### Render
1. Go to your service dashboard
2. Go to **Environment** section
3. Click **Add Environment Variable**
4. Add each variable

### Vercel
1. Go to your project dashboard
2. Go to **Settings** → **Environment Variables**
3. Click **Add New**
4. Add each variable
5. Select environment (Production, Preview, Development)

---

## Environment-Specific Values

### Development (Local)
```bash
# Backend (.env in backend/)
FLASK_ENV=development
DEBUG=True
HOST=0.0.0.0
PORT=5000
SECRET_KEY=dev-secret-key
CORS_ORIGINS=http://localhost:3000

# Frontend (.env.local in frontend/)
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
# ... Firebase vars from Firebase Console
```

### Production
```bash
# Backend (Railway/Render)
FLASK_ENV=production
DEBUG=False
HOST=0.0.0.0
PORT=5000  # Auto-set by platform
SECRET_KEY=<generated-secret>
CORS_ORIGINS=https://your-app.vercel.app

# Frontend (Vercel)
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
BACKEND_URL=https://your-backend.railway.app
# ... Firebase vars (same as dev)
```

---

## Security Notes

1. **Never commit** `.env` files to Git
2. **Use strong SECRET_KEY** in production
3. **Restrict CORS_ORIGINS** to your frontend domain only
4. **Keep Firebase keys secure** (they're public in frontend but still protect them)
5. **Rotate SECRET_KEY** if compromised

---

## Quick Copy-Paste Template

### Backend (Railway/Render)
```
FLASK_ENV=production
DEBUG=False
HOST=0.0.0.0
PORT=5000
SECRET_KEY=<generate-your-own>
CORS_ORIGINS=https://your-app.vercel.app
```

### Frontend (Vercel)
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend.railway.app
BACKEND_URL=https://your-backend.railway.app
NEXT_PUBLIC_FIREBASE_API_KEY=<from-firebase>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<from-firebase>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<from-firebase>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<from-firebase>
NEXT_PUBLIC_FIREBASE_APP_ID=<from-firebase>
```

---

## Verifying Variables

### Backend
```bash
# Test locally
cd backend
python -c "from config import get_config; print(get_config().SECRET_KEY)"
```

### Frontend
```bash
# Check in browser console (after build)
console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
```

---

## Common Issues

### "CORS error"
- Check `CORS_ORIGINS` includes your frontend URL
- Ensure no trailing slashes
- Verify protocol (http vs https)

### "Backend not found"
- Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- Check backend is running
- Verify no typos in URL

### "Firebase not initialized"
- Check all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Verify values match Firebase Console
- Ensure variables start with `NEXT_PUBLIC_` (required for client-side)

