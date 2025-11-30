# 🔧 Eco-Eco Backend API

Flask-based REST API for waste classification using TensorFlow.

## Features

- 🤖 AI-powered waste classification
- 📸 Image upload and processing
- 🔄 CORS support for frontend integration
- 📊 Real-time prediction API
- 🛡️ Error handling and logging
- 🚀 Production-ready with Gunicorn

## Quick Start
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
```

## Installation

### 1. Create Virtual Environment
```bash
python -m venv venv

# Activate
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Create `.env` file:
```env
FLASK_ENV=development
DEBUG=True
PORT=5000
MODEL_PATH=model/model.h5
```

### 4. Run Server
```bash
python app.py
```

Server runs on: http://localhost:5000

## API Endpoints

### GET /
API information and available endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "message": "Eco-Eco API is running",
  "model_loaded": true
}
```

### POST /api/analyze
Analyze waste image

**Request:**
Content-Type: multipart/form-data
Body: { "image": <file> }