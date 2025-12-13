"""Test model loading directly"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(override=True)

from config import get_config
from model.predict import WastePredictor

print("=" * 60)
print("Testing Model Loading")
print("=" * 60)

config = get_config()
print(f"\nConfiguration:")
print(f"  MODEL_PATH: {config.MODEL_PATH}")
print(f"  ML_PROVIDER: {config.ML_PROVIDER}")
print(f"  Model exists: {os.path.exists(config.MODEL_PATH)}")

print(f"\nInitializing predictor...")
try:
    predictor = WastePredictor(
        model_path=config.MODEL_PATH,
        provider=config.ML_PROVIDER
    )
    
    print(f"\n✅ Predictor initialized!")
    print(f"   Model loaded: {predictor.model_loaded}")
    print(f"   Provider: {type(predictor.provider).__name__ if predictor.provider else 'None'}")
    print(f"   Provider name: {predictor.provider_name}")
    
    if predictor.model_loaded:
        print(f"\n✅ Using custom trained model (model.h5)")
    elif predictor.provider:
        print(f"\n⚠️  Using ML provider instead of custom model")
    else:
        print(f"\n⚠️  Running in demo mode")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)

