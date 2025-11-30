from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.serving import WSGIRequestHandler
import os
import traceback
from datetime import datetime
from pathlib import Path
import logging
import warnings

# Set TensorFlow logging level BEFORE importing TensorFlow
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress INFO and WARNING
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN to avoid warnings

# Suppress warnings - more aggressive filtering
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='.*sparse_softmax_cross_entropy.*')
warnings.filterwarnings('ignore', message='.*deprecated.*')
warnings.filterwarnings('ignore', message='.*tf.losses.*')

# Suppress noisy log messages from Werkzeug for bad requests (TLS handshake attempts)
logging.getLogger('werkzeug').setLevel(logging.WARNING)

from config import get_config
from model.predict import WastePredictor

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(get_config())

# Initialize CORS
CORS(app, resources={
    r"/api/*": {
        "origins": app.config['CORS_ORIGINS'],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Initialize model predictor
predictor = WastePredictor(model_path=app.config['MODEL_PATH'])

# Create necessary directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('logs', exist_ok=True)

# Logging setup
from loguru import logger
logger.add(
    app.config['LOG_FILE'],
    rotation="500 MB",
    retention="10 days",
    level=app.config['LOG_LEVEL']
)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def cleanup_old_files():
    """Clean up old uploaded files (older than 1 hour)"""
    try:
        upload_folder = Path(app.config['UPLOAD_FOLDER'])
        current_time = datetime.now().timestamp()
        
        for file_path in upload_folder.glob('*'):
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > 3600:  # 1 hour
                    file_path.unlink()
                    logger.info(f"Deleted old file: {file_path.name}")
    except Exception as e:
        logger.error(f"Error cleaning up files: {str(e)}")

@app.route('/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        'name': 'Eco-Eco Trash Talk API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            '/': 'GET - API information',
            '/health': 'GET - Health check',
            '/api/analyze': 'POST - Analyze waste image',
            '/api/stats': 'GET - API statistics'
        }
    }), 200

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Eco-Eco API is running',
        'timestamp': datetime.utcnow().isoformat(),
        'model_loaded': predictor.model_loaded
    }), 200

@app.route('/api/analyze', methods=['POST', 'OPTIONS'])
def analyze_image():
    """
    Analyze waste image endpoint
    
    Expected: multipart/form-data with 'image' file
    Returns: JSON with classification results
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Clean up old files
        cleanup_old_files()
        
        # Validate request
        if 'image' not in request.files:
            logger.warning("No image provided in request")
            return jsonify({
                'error': 'No image provided',
                'message': 'Please upload an image file'
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            logger.warning("No file selected")
            return jsonify({
                'error': 'No file selected',
                'message': 'Please select a file to upload'
            }), 400
        
        # Validate file type
        if not allowed_file(file.filename):
            logger.warning(f"Invalid file type: {file.filename}")
            return jsonify({
                'error': 'Invalid file type',
                'message': f'Allowed types: {", ".join(app.config["ALLOWED_EXTENSIONS"])}'
            }), 400
        
        # Save file temporarily
        filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        logger.info(f"Processing image: {filename}")
        
        # Predict waste type
        result = predictor.predict(filepath)
        
        # Delete temporary file
        try:
            os.remove(filepath)
            logger.info(f"Deleted temporary file: {filename}")
        except Exception as e:
            logger.error(f"Error deleting file: {str(e)}")
        
        logger.info(f"Analysis complete: {result['item']} ({result['confidence']}%)")
        
        return jsonify({
            'success': True,
            'data': result,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error analyzing image: {str(e)}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to analyze image',
            'details': str(e) if app.config['DEBUG'] else 'Please try again'
        }), 500

@app.route('/api/stats', methods=['GET'])
def api_stats():
    """API statistics endpoint"""
    return jsonify({
        'total_analyses': 0,  # Implement counter if needed
        'model_info': {
            'loaded': predictor.model_loaded,
            'version': '1.0.0',
            'categories': len(predictor.WASTE_CATEGORIES)
        },
        'uptime': 'N/A'  # Implement uptime tracking if needed
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Not found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(400)
def bad_request(error):
    """Handle 400 errors"""
    # Werkzeug already handles bad request versions (like TLS handshakes)
    # We'll just return a simple response without logging
    return jsonify({
        'error': 'Bad request',
        'message': 'The request could not be processed'
    }), 400

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'Something went wrong on our end'
    }), 500

if __name__ == '__main__':
    logger.info("="*50)
    logger.info("Starting Eco-Eco Trash Talk API")
    logger.info(f"Environment: {os.getenv('FLASK_ENV', 'development')}")
    logger.info(f"Debug Mode: {app.config['DEBUG']}")
    logger.info(f"Model Loaded: {predictor.model_loaded}")
    logger.info("="*50)
    
    app.run(
        host=app.config['HOST'],
        port=app.config['PORT'],
        debug=app.config['DEBUG']
    )