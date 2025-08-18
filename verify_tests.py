#!/usr/bin/env python3
"""
Verify test setup for Bin Packer Cloud App
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    """Test if all required modules can be imported"""
    print("🔍 Testing Imports...")
    
    try:
        import pytest
        print("✅ pytest imported successfully")
    except ImportError:
        print("❌ pytest not found. Install with: pip install pytest")
        return False
    
    try:
        from fastapi.testclient import TestClient
        print("✅ TestClient imported successfully")
    except ImportError:
        print("❌ TestClient not found. Install with: pip install httpx")
        return False
    
    try:
        from api.main import app
        print("✅ FastAPI app imported successfully")
    except Exception as e:
        print(f"❌ FastAPI app import failed: {str(e)}")
        return False
    
    return True

def test_test_client():
    """Test if TestClient can be created"""
    print("\n🔍 Testing TestClient...")
    
    try:
        from fastapi.testclient import TestClient
        from api.main import app
        
        client = TestClient(app)
        print("✅ TestClient created successfully")
        
        # Test a simple request
        response = client.get("/")
        print(f"✅ Root endpoint test: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"❌ TestClient test failed: {str(e)}")
        return False

def test_basic_functionality():
    """Test basic API functionality"""
    print("\n🔍 Testing Basic Functionality...")
    
    try:
        from fastapi.testclient import TestClient
        from api.main import app
        
        client = TestClient(app)
        
        # Test health endpoint
        response = client.get("/api/v1/health")
        if response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
        
        # Test statistics endpoint
        response = client.get("/api/v1/statistics")
        if response.status_code == 200:
            print("✅ Statistics endpoint working")
        else:
            print(f"❌ Statistics endpoint failed: {response.status_code}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Basic functionality test failed: {str(e)}")
        return False

def main():
    """Run all verification tests"""
    print("🧪 Verifying Test Setup...")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("TestClient", test_test_client),
        ("Basic Functionality", test_basic_functionality)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📈 Verification Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 Test setup is working correctly!")
        print("\n💡 To run tests, use:")
        print("   python -m pytest tests/ -v")
        print("   python run_tests.py")
    else:
        print("⚠️  Some verification tests failed.")
        print("🔧 Please check the errors above.")

if __name__ == "__main__":
    main() 