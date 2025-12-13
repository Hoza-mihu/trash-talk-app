"""Test custom model setup"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(override=True)

from model.predict import WastePredictor

print("=" * 60)
print("Testing Custom Model (model.h5)")
print("=" * 60)

try:
    # Don't pass provider - let it use custom model if available
    predictor = WastePredictor()
    
    print(f"\n✅ Backend ready!")
    print(f"   Custom model loaded: {predictor.model_loaded}")
    print(f"   Provider: {type(predictor.provider).__name__ if predictor.provider else 'None'}")
    
    if predictor.model_loaded:
        print(f"\n✅ Using custom trained model (model.h5) - Best accuracy!")
        print(f"   This is your model trained on waste classification data.")
    elif predictor.provider:
        print(f"\n⚠️  Using ML provider (custom model not found)")
        print(f"   Provider: {type(predictor.provider).__name__}")
    else:
        print(f"\n⚠️  Running in demo mode (no model or provider)")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)

