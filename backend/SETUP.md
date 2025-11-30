# Backend Setup Guide

## Quick Start

1. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env` file** (copy from `.env.example` if available):
   ```env
   FLASK_ENV=development
   DEBUG=True
   PORT=5000
   MODEL_PATH=model/model.h5
   CORS_ORIGINS=http://localhost:3000
   ```

4. **Ensure model file exists:**
   - The model should be at `backend/model/model.h5`
   - If you trained a model in `model-training`, copy it:
     ```bash
     # From project root
     cp model-training/models/final/*.h5 backend/model/model.h5
     ```
   - If no model exists, the backend will run in demo mode with random predictions

5. **Run the server:**
   ```bash
   python app.py
   ```

   Server will start on: http://localhost:5000

## Connecting Frontend

The frontend should be configured to call the backend at `http://localhost:5000/api/analyze`.

Make sure:
- Backend is running on port 5000
- Frontend is running on port 3000 (or update CORS_ORIGINS in `.env`)
- Frontend has `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000` in its environment

## Testing Connection

1. **Health check:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Test analysis:**
   ```bash
   curl -X POST -F "image=@path/to/image.jpg" http://localhost:5000/api/analyze
   ```

## Troubleshooting

### Model not loading
- Check that `model/model.h5` exists
- Check file permissions
- Backend will run in demo mode if model is missing

### CORS errors
- Update `CORS_ORIGINS` in `.env` to include your frontend URL
- Restart the backend server

### Port already in use
- Change `PORT` in `.env` to a different port (e.g., 5001)
- Update frontend to use the new port

