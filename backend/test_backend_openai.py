"""Quick test to verify backend is ready with OpenAI"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv(override=True)

from model.predict import WastePredictor

print("=" * 60)
print("Testing Backend with OpenAI")
print("=" * 60)

try:
    predictor = WastePredictor(provider='openai')
    
    print(f"\n✅ Backend ready!")
    print(f"   Provider: {type(predictor.provider).__name__ if predictor.provider else 'None'}")
    print(f"   Custom model loaded: {predictor.model_loaded}")
    
    if predictor.provider:
        print(f"\n✅ Using OpenAI provider - Ready to classify images!")
    elif predictor.model_loaded:
        print(f"\n⚠️  Using custom model (provider not initialized)")
    else:
        print(f"\n⚠️  Running in demo mode")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)

