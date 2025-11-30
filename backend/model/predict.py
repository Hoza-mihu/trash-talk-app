import numpy as np
from PIL import Image
import os
from typing import Dict, Optional
# cv2 removed - not used in this code, using PIL instead

# Suppress TensorFlow warnings BEFORE importing
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress INFO and WARNING
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN to avoid warnings

# Suppress deprecation warnings
import warnings
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', message='.*sparse_softmax_cross_entropy.*')
warnings.filterwarnings('ignore', message='.*deprecated.*')

# Try to import TensorFlow
try:
    import tensorflow as tf
    # Suppress TensorFlow internal warnings
    tf.get_logger().setLevel('ERROR')
    from tensorflow import keras
    
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("⚠️  TensorFlow not available. Using demo mode.")

class WastePredictor:
    """Waste classification predictor"""
    
    # Waste categories with metadata
    WASTE_CATEGORIES = {
        0: {
            'name': 'Glass',
            'type': 'Recyclable',
            'tip': 'Separate by color when possible. Remove caps and lids. Rinse before recycling.',
            'co2': 0.4,
            'color': '#8B5CF6',
            'icon': '🍾'
        },

1: {
            'name': 'Metal',
            'type': 'Recyclable',
            'tip': 'Aluminum cans are infinitely recyclable! Rinse before recycling. Separate steel and aluminum if required.',
            'co2': 0.6,
            'color': '#EF4444',
            'icon': '🥫'
        },
2: {
            'name': 'Organic Waste',
            'type': 'Compostable',
            'tip': 'Perfect for composting! Add to your compost bin or use municipal composting services.',
            'co2': 0.2,
            'color': '#F59E0B',
            'icon': '🍂'
        },
3: {
            'name': 'Paper',
            'type': 'Recyclable',
            'tip': 'Keep paper clean and dry. Remove plastic windows, tape, staples, and clips before recycling. Flatten boxes to save space. Avoid recycling greasy pizza boxes, waxed paper, or paper with food residue. Newspapers, magazines, office paper, and cardboard are all recyclable. Check local guidelines for specific requirements.',
            'co2': 0.3,
            'color': '#10B981',
            'icon': '📄'
        },
4: {
            'name': 'Plastic',
            'type': 'Recyclable',
            'tip': 'Rinse thoroughly and remove labels before recycling. Check local guidelines for plastic types accepted.',
            'co2': 0.5,
            'color': '#3B82F6',
            'icon': '♻️'
        },
5: {
            'name': 'Textiles',
            'type': 'Recyclable',
            'tip': 'Donate wearable clothes to charity. For damaged items, use textile recycling bins. Clean and dry items before donating. Remove zippers and buttons if possible. Natural fibers like cotton and wool are more easily recycled than synthetic blends.',
            'co2': 0.7,
            'color': '#EC4899',
            'icon': '👕'
        },
    }
    
    def __init__(self, model_path: Optional[str] = None):
        """Initialize predictor"""
        self.model = None
        self.model_loaded = False
        self.img_size = 224
        
        if model_path and os.path.exists(model_path) and TF_AVAILABLE:
            self._load_model(model_path)
        else:
            print("📊 Running in demo mode (no model loaded)")
    
    def _load_model(self, model_path: str):
        """Load trained model"""
        try:
            # Check if file exists
            if not os.path.exists(model_path):
                print(f"❌ Model file not found: {model_path}")
                self.model = None
                self.model_loaded = False
                return
            
            # Check if file is not empty
            file_size = os.path.getsize(model_path)
            if file_size == 0:
                print(f"❌ Model file is empty (0 bytes): {model_path}")
                print("   Please ensure the model file was saved correctly.")
                self.model = None
                self.model_loaded = False
                return
            
            # Try to load the model
            self.model = keras.models.load_model(model_path)
            self.model_loaded = True
            print(f"✅ Model loaded successfully from {model_path} ({file_size:,} bytes)")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            print(f"   Model path: {model_path}")
            if os.path.exists(model_path):
                file_size = os.path.getsize(model_path)
                print(f"   File exists, size: {file_size:,} bytes")
            self.model = None
            self.model_loaded = False
    
    def preprocess_image(self, image_path: str) -> np.ndarray:
        """
        Preprocess image for model prediction
        
        Args:
            image_path: Path to image file
            
        Returns:
            Preprocessed numpy array
        """
        # Load image
        image = Image.open(image_path)
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Resize to model input size
        image = image.resize((self.img_size, self.img_size))
        
        # Convert to numpy array and normalize
        image_array = np.array(image) / 255.0
        
        # Add batch dimension
        image_array = np.expand_dims(image_array, axis=0)
        
        return image_array
    
    def predict(self, image_path: str) -> Dict:
        """
        Predict waste category from image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with prediction results
        """
        if self.model_loaded and self.model is not None:
            # Real prediction with model
            processed_image = self.preprocess_image(image_path)
            predictions = self.model.predict(processed_image, verbose=0)
            category_id = int(np.argmax(predictions[0]))
            confidence = float(predictions[0][category_id] * 100)
        else:
            # Demo prediction
            category_id = np.random.randint(0, len(self.WASTE_CATEGORIES))
            confidence = float(np.random.uniform(85, 99))
        
        # Get category information
        category_info = self.WASTE_CATEGORIES[category_id]
        
        # Build result
        result = {
            'item': category_info['name'],
            'category': category_info['type'],
            'confidence': round(confidence, 1),
            'tip': category_info['tip'],
            'co2': category_info['co2'],
            'color': category_info['color'],
            'icon': category_info['icon'],
            'category_id': category_id
        }
        
        return result
    
    def predict_batch(self, image_paths: list) -> list:
        """
        Predict multiple images
        
        Args:
            image_paths: List of image paths
            
        Returns:
            List of prediction results
        """
        return [self.predict(path) for path in image_paths]