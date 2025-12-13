"""
Quick test to verify OpenAI setup
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("OpenAI Setup Verification")
print("=" * 60)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Check configuration
print("\n1. Checking configuration...")
ml_provider = os.getenv('ML_PROVIDER')
openai_key = os.getenv('OPENAI_API_KEY')

if ml_provider == 'openai':
    print(f"   ✅ ML_PROVIDER is set to: {ml_provider}")
else:
    print(f"   ❌ ML_PROVIDER is set to: {ml_provider} (should be 'openai')")
    print("   💡 Update .env file: ML_PROVIDER=openai")

if openai_key:
    # Mask the key for security
    masked_key = openai_key[:7] + "..." + openai_key[-4:] if len(openai_key) > 11 else "***"
    print(f"   ✅ OPENAI_API_KEY is set: {masked_key}")
else:
    print("   ❌ OPENAI_API_KEY is not set")
    print("   💡 Get your API key from: https://platform.openai.com/api-keys")
    print("   💡 Add to .env file: OPENAI_API_KEY=sk-your-key-here")

# Test provider import
print("\n2. Testing provider import...")
try:
    from model.providers import get_provider
    print("   ✅ Provider module imported successfully")
except ImportError as e:
    print(f"   ❌ Error importing providers: {e}")
    sys.exit(1)

# Test provider initialization
print("\n3. Testing OpenAI provider initialization...")
if openai_key:
    try:
        provider = get_provider('openai')
        print("   ✅ OpenAI provider initialized successfully")
        print(f"   Provider type: {type(provider).__name__}")
    except ValueError as e:
        print(f"   ❌ {e}")
        print("   💡 Make sure OPENAI_API_KEY is set in .env file")
    except Exception as e:
        print(f"   ⚠️  Error: {e}")
else:
    print("   ⚠️  Skipping initialization test (no API key)")

# Summary
print("\n" + "=" * 60)
if ml_provider == 'openai' and openai_key:
    print("✅ Setup looks good!")
    print("\nNext steps:")
    print("1. Start your backend: python app.py")
    print("2. You should see: '✅ Using openai ML provider'")
    print("3. Test with an image upload")
elif ml_provider != 'openai':
    print("⚠️  ML_PROVIDER needs to be set to 'openai'")
    print("   Update .env file: ML_PROVIDER=openai")
elif not openai_key:
    print("⚠️  OPENAI_API_KEY is missing")
    print("\nTo get your API key:")
    print("1. Go to https://platform.openai.com/api-keys")
    print("2. Click 'Create new secret key'")
    print("3. Copy the key")
    print("4. Add to .env: OPENAI_API_KEY=sk-your-key-here")
    print("5. Add billing info at https://platform.openai.com/account/billing")
print("=" * 60)

