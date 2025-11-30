#!/usr/bin/env python3
"""
Simple script to test backend connection
"""
import requests
import sys

def test_backend(base_url="http://localhost:5000"):
    """Test backend endpoints"""
    print("=" * 60)
    print("🧪 Testing Backend Connection")
    print("=" * 60)
    print()
    
    # Test 1: Health check
    print("1. Testing /health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health check passed")
            print(f"   Status: {data.get('status')}")
            print(f"   Model loaded: {data.get('model_loaded')}")
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Cannot connect to {base_url}")
        print(f"   Make sure the backend is running!")
        return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print()
    
    # Test 2: Root endpoint
    print("2. Testing / endpoint...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Root endpoint working")
            print(f"   API: {data.get('name')}")
            print(f"   Version: {data.get('version')}")
        else:
            print(f"   ❌ Root endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 3: Stats endpoint
    print("3. Testing /api/stats endpoint...")
    try:
        response = requests.get(f"{base_url}/api/stats", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Stats endpoint working")
            print(f"   Model info: {data.get('model_info', {})}")
        else:
            print(f"   ❌ Stats endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    print("=" * 60)
    print("✅ Backend connection test completed!")
    print("=" * 60)
    print()
    print("Note: To test image analysis, use:")
    print(f"  curl -X POST -F 'image=@path/to/image.jpg' {base_url}/api/analyze")
    print()
    
    return True

if __name__ == "__main__":
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    success = test_backend(base_url)
    sys.exit(0 if success else 1)

