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
    print("⚠️  TensorFlow not available. Using alternative providers.")

# Import alternative providers
try:
    from .providers import get_provider, BaseProvider
    PROVIDERS_AVAILABLE = True
except ImportError:
    PROVIDERS_AVAILABLE = False
    print("⚠️  Alternative providers not available.")

class WastePredictor:
    """Waste classification predictor"""
    
    # Waste categories with metadata
    # IMPORTANT: Class indices must match the alphabetical order from ImageDataGenerator
    # Order: e-waste, glass, metal, organic-waste, paper-and-cardboard, plastic, textiles
    WASTE_CATEGORIES = {
        0: {
            'name': 'E-Waste',
            'type': 'Special Handling',
            'tip': 'E-waste contains valuable materials and toxic substances. Never throw in regular trash! Take to certified e-waste recycling centers. Remove batteries if possible. Many retailers offer take-back programs. Check local regulations for proper disposal.',
            'co2': 1.2,
            'color': '#F97316',
            'icon': '🔌'
        },
        1: {
            'name': 'Glass',
            'type': 'Recyclable',
            'tip': 'Separate by color when possible. Remove caps and lids. Rinse before recycling.',
            'co2': 0.4,
            'color': '#8B5CF6',
            'icon': '🍾'
        },
        2: {
            'name': 'Metal',
            'type': 'Recyclable',
            'tip': 'Aluminum cans are infinitely recyclable! Rinse before recycling. Separate steel and aluminum if required.',
            'co2': 0.6,
            'color': '#EF4444',
            'icon': '🥫'
        },
        3: {
            'name': 'Organic Waste',
            'type': 'Compostable',
            'tip': 'Perfect for composting! Add to your compost bin or use municipal composting services.',
            'co2': 0.2,
            'color': '#F59E0B',
            'icon': '🍂'
        },
        4: {
            'name': 'Paper and Cardboard',
            'type': 'Recyclable',
            'tip': 'Keep paper clean and dry. Remove plastic windows, tape, staples, and clips before recycling. Flatten boxes to save space. Avoid recycling greasy pizza boxes, waxed paper, or paper with food residue. Newspapers, magazines, office paper, and cardboard are all recyclable. Check local guidelines for specific requirements.',
            'co2': 0.3,
            'color': '#10B981',
            'icon': '📄'
        },
        5: {
            'name': 'Plastic',
            'type': 'Recyclable',
            'tip': 'Rinse thoroughly and remove labels before recycling. Check local guidelines for plastic types accepted.',
            'co2': 0.5,
            'color': '#3B82F6',
            'icon': '♻️'
        },
        6: {
            'name': 'Textiles',
            'type': 'Recyclable',
            'tip': 'Donate wearable clothes to charity. For damaged items, use textile recycling bins. Clean and dry items before donating. Remove zippers and buttons if possible. Natural fibers like cotton and wool are more easily recycled than synthetic blends.',
            'co2': 0.7,
            'color': '#EC4899',
            'icon': '👕'
        },
    }
    
    def __init__(self, model_path: Optional[str] = None, provider: Optional[str] = None):
        """
        Initialize predictor
        
        Args:
            model_path: Path to custom trained model (optional)
            provider: ML provider to use ('huggingface', 'openai', 'google', 'tensorflow_hub', or None for auto)
        """
        self.model = None
        self.model_loaded = False
        self.img_size = 224
        self.provider = None
        self.provider_name = provider or os.getenv('ML_PROVIDER', None)
        
        # Priority: If ML_PROVIDER is set, use provider instead of custom model
        if self.provider_name and PROVIDERS_AVAILABLE:
            try:
                self.provider = get_provider(self.provider_name)
                print(f"✅ Using {self.provider_name} ML provider")
            except Exception as e:
                print(f"⚠️  Could not initialize ML provider: {e}")
                print("📊 Falling back to custom model or demo mode")
                # Fallback to custom model if provider fails
                if model_path and os.path.exists(model_path) and TF_AVAILABLE:
                    self._load_model(model_path)
        else:
            # No provider specified, try to load custom model
            if model_path and os.path.exists(model_path) and TF_AVAILABLE:
                self._load_model(model_path)
            elif not self.model_loaded:
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
        # Priority 1: Use ML provider if configured
        if self.provider is not None:
            try:
                return self.provider.predict(image_path)
            except Exception as e:
                print(f"⚠️  Error with ML provider, falling back: {e}")
        
        # Priority 2: Use custom trained model if available
        if self.model_loaded and self.model is not None:
            try:
                processed_image = self.preprocess_image(image_path)
                predictions = self.model.predict(processed_image, verbose=0)
                category_id = int(np.argmax(predictions[0]))
                confidence = float(predictions[0][category_id] * 100)
                
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
            except Exception as e:
                print(f"⚠️  Error with custom model, falling back: {e}")
        
        # Priority 3: Demo mode (random prediction)
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