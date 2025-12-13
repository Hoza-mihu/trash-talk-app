"""
Quick test script to verify ML providers are set up correctly
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("Testing ML Provider Setup")
print("=" * 60)

# Test 1: Check dependencies
print("\n1. Checking dependencies...")
try:
    import requests
    print("   ✅ requests installed")
except ImportError:
    print("   ❌ requests not installed")
    sys.exit(1)

try:
    import tensorflow_hub
    print("   ✅ tensorflow-hub installed")
except ImportError:
    print("   ⚠️  tensorflow-hub not installed (optional)")

# Test 2: Check provider imports
print("\n2. Checking provider imports...")
try:
    from model.providers import get_provider, BaseProvider
    print("   ✅ Provider module imported successfully")
except ImportError as e:
    print(f"   ❌ Error importing providers: {e}")
    sys.exit(1)

# Test 3: Check environment variables
print("\n3. Checking environment variables...")
from dotenv import load_dotenv
load_dotenv()

ml_provider = os.getenv('ML_PROVIDER')
if ml_provider:
    print(f"   ✅ ML_PROVIDER set to: {ml_provider}")
else:
    print("   ⚠️  ML_PROVIDER not set (will use custom model if available)")

# Test 4: Try to initialize provider
print("\n4. Testing provider initialization...")
if ml_provider:
    try:
        provider = get_provider(ml_provider)
        print(f"   ✅ {ml_provider} provider initialized successfully")
        print(f"   Provider type: {type(provider).__name__}")
    except Exception as e:
        print(f"   ⚠️  Could not initialize provider: {e}")
        print("   This is okay if API keys are not set yet")
else:
    print("   ℹ️  No provider specified, will use custom model or demo mode")

# Test 5: Check predict module
print("\n5. Checking predict module...")
try:
    from model.predict import WastePredictor
    print("   ✅ WastePredictor imported successfully")
    
    # Try to initialize (without actually loading model)
    predictor = WastePredictor(provider=ml_provider)
    print("   ✅ WastePredictor initialized successfully")
    
    if predictor.provider:
        print(f"   ✅ Using provider: {type(predictor.provider).__name__}")
    elif predictor.model_loaded:
        print("   ✅ Using custom trained model")
    else:
        print("   ℹ️  Running in demo mode")
        
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("✅ Setup verification complete!")
print("=" * 60)
print("\nNext steps:")
print("1. If using Hugging Face: You're ready to go! (No API key needed)")
print("2. If using OpenAI: Set OPENAI_API_KEY in .env file")
print("3. If using Google Cloud: Set GOOGLE_CLOUD_API_KEY in .env file")
print("4. Start your backend: python app.py")

