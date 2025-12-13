"""
Interactive OpenAI Setup Script
This script will help you set up OpenAI API key
"""
import os
import sys
from pathlib import Path

def get_env_file_path():
    """Get the path to .env file"""
    return Path(__file__).parent / '.env'

def read_env_file():
    """Read .env file and return as dictionary"""
    env_path = get_env_file_path()
    env_vars = {}
    
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    
    return env_vars

def write_env_file(env_vars):
    """Write environment variables to .env file"""
    env_path = get_env_file_path()
    
    # Read existing file to preserve comments
    lines = []
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    
    # Update or add ML_PROVIDER
    updated = False
    for i, line in enumerate(lines):
        if line.strip().startswith('ML_PROVIDER='):
            lines[i] = f"ML_PROVIDER={env_vars.get('ML_PROVIDER', 'openai')}\n"
            updated = True
        elif line.strip().startswith('OPENAI_API_KEY='):
            lines[i] = f"OPENAI_API_KEY={env_vars.get('OPENAI_API_KEY', '')}\n"
            updated = True
    
    # Add if not found
    if not any('ML_PROVIDER=' in line for line in lines):
        lines.append(f"\n# ML Provider Configuration\nML_PROVIDER={env_vars.get('ML_PROVIDER', 'openai')}\n")
    
    if not any('OPENAI_API_KEY=' in line for line in lines):
        lines.append(f"\n# OpenAI Vision API\nOPENAI_API_KEY={env_vars.get('OPENAI_API_KEY', '')}\n")
    
    # Write back
    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

def main():
    print("=" * 70)
    print("OpenAI API Key Setup")
    print("=" * 70)
    print()
    
    # Check current configuration
    env_vars = read_env_file()
    current_provider = env_vars.get('ML_PROVIDER', '')
    current_key = env_vars.get('OPENAI_API_KEY', '')
    
    print("Current Configuration:")
    print(f"  ML_PROVIDER: {current_provider if current_provider else 'Not set'}")
    if current_key:
        masked = current_key[:7] + "..." + current_key[-4:] if len(current_key) > 11 else "***"
        print(f"  OPENAI_API_KEY: {masked}")
    else:
        print("  OPENAI_API_KEY: Not set")
    print()
    
    # Instructions
    print("=" * 70)
    print("STEP 1: Get Your OpenAI API Key")
    print("=" * 70)
    print()
    print("1. Open your browser and go to:")
    print("   https://platform.openai.com/api-keys")
    print()
    print("2. Click 'Create new secret key'")
    print()
    print("3. Copy the key (it starts with 'sk-')")
    print()
    print("4. If you don't have billing set up:")
    print("   Go to: https://platform.openai.com/account/billing")
    print("   Add a payment method (required for API usage)")
    print()
    
    # Get API key from user
    print("=" * 70)
    print("STEP 2: Enter Your API Key")
    print("=" * 70)
    print()
    
    if current_key:
        print(f"Current key: {current_key[:7]}...{current_key[-4:]}")
        response = input("Do you want to update it? (y/n): ").strip().lower()
        if response != 'y':
            print("\nKeeping existing key.")
            return
        print()
    
    api_key = input("Paste your OpenAI API key here (or press Enter to skip): ").strip()
    
    if not api_key:
        print("\n⚠️  No API key entered. Setup incomplete.")
        print("\nYou can:")
        print("1. Run this script again later")
        print("2. Manually edit backend/.env and add: OPENAI_API_KEY=sk-your-key")
        return
    
    # Validate key format
    if not api_key.startswith('sk-'):
        print("\n⚠️  Warning: API keys usually start with 'sk-'. Are you sure this is correct?")
        confirm = input("Continue anyway? (y/n): ").strip().lower()
        if confirm != 'y':
            print("Setup cancelled.")
            return
    
    # Update .env file
    env_vars['ML_PROVIDER'] = 'openai'
    env_vars['OPENAI_API_KEY'] = api_key
    
    try:
        write_env_file(env_vars)
        print("\n✅ Configuration updated successfully!")
        print(f"   ML_PROVIDER: openai")
        print(f"   OPENAI_API_KEY: {api_key[:7]}...{api_key[-4:]}")
    except Exception as e:
        print(f"\n❌ Error updating .env file: {e}")
        print("\nYou can manually edit backend/.env and add:")
        print(f"ML_PROVIDER=openai")
        print(f"OPENAI_API_KEY={api_key}")
        return
    
    # Test the setup
    print("\n" + "=" * 70)
    print("STEP 3: Verifying Setup")
    print("=" * 70)
    print()
    
    try:
        # Reload environment
        from dotenv import load_dotenv
        load_dotenv(override=True)
        
        # Test provider import
        sys.path.insert(0, os.path.dirname(__file__))
        from model.providers import get_provider
        
        print("Testing OpenAI provider...")
        provider = get_provider('openai')
        print(f"✅ OpenAI provider initialized successfully!")
        print(f"   Provider type: {type(provider).__name__}")
        
    except ValueError as e:
        print(f"❌ Error: {e}")
        print("\nPlease check:")
        print("1. Your API key is correct")
        print("2. You have billing set up at https://platform.openai.com/account/billing")
    except Exception as e:
        print(f"⚠️  Could not test provider: {e}")
        print("This might be okay - try starting your backend to verify.")
    
    print("\n" + "=" * 70)
    print("Setup Complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Start your backend:")
    print("   cd backend")
    print("   venv\\Scripts\\activate")
    print("   python app.py")
    print()
    print("2. You should see: '✅ Using openai ML provider'")
    print()
    print("3. Test with an image upload through your frontend")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user.")
        sys.exit(0)

