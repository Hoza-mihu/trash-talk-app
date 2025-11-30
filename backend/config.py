import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent

class Config:
    """Base configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Model
    # Default path: backend/model/model.h5
    # Can also use absolute path or path relative to backend directory
    default_model_path = os.path.join(BASE_DIR, 'model', 'model.h5')
    model_path_env = os.getenv('MODEL_PATH')
    if model_path_env:
        # If absolute path, use as-is; otherwise make relative to BASE_DIR
        if os.path.isabs(model_path_env):
            MODEL_PATH = model_path_env
        else:
            MODEL_PATH = os.path.join(BASE_DIR, model_path_env)
    else:
        MODEL_PATH = default_model_path
    
    # File Upload
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv('UPLOAD_FOLDER', 'uploads'))
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'png,jpg,jpeg,gif,webp').split(','))
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.path.join(BASE_DIR, os.getenv('LOG_FILE', 'logs/app.log'))
    
    # API Keys
    GOOGLE_CLOUD_API_KEY = os.getenv('GOOGLE_CLOUD_API_KEY', '')
    FIREBASE_ADMIN_SDK = os.getenv('FIREBASE_ADMIN_SDK', '')
    
    @staticmethod
    def init_app(app):
        """Initialize application"""
        # Create required directories
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(os.path.dirname(Config.LOG_FILE), exist_ok=True)

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

# Get current config
def get_config():
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])