#!/usr/bin/env python3
"""
Simple verification script for the FastAPI application
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_api_import():
    """Test if the API module can be imported correctly"""
    print("🔍 Testing API Import...")
    
    try:
        from api.main import app, OptimizationRequest, ItemRequest, TruckRequest
        print("✅ API module imported successfully!")
        print(f"   FastAPI app: {app.title}")
        print(f"   Version: {app.version}")
        return True
    except Exception as e:
        print(f"❌ API import failed: {str(e)}")
        return False

def test_algorithm_integration():
    """Test if the algorithm can be imported and used"""
    print("\n🔍 Testing Algorithm Integration...")
    
    try:
        from algorithm.bin_packer_v3 import BinPackerV3, Item
        print("✅ Algorithm module imported successfully!")
        
        # Test basic algorithm functionality
        packer = BinPackerV3(10.0, 2.5, 2.5)
        items = [
            Item("test1", 1.0, 0.8, 0.6, 50.0),
            Item("test2", 0.5, 0.5, 0.5, 25.0),
        ]
        
        result = packer.pack_items(items)
        print(f"✅ Algorithm test completed!")
        print(f"   Efficiency: {result['efficiency']}%")
        print(f"   Items placed: {result['statistics']['items_placed']}")
        
        return True
    except Exception as e:
        print(f"❌ Algorithm integration failed: {str(e)}")
        return False

def test_request_models():
    """Test if the Pydantic models work correctly"""
    print("\n🔍 Testing Request Models...")
    
    try:
        from api.main import OptimizationRequest, ItemRequest, TruckRequest
        
        # Test truck model
        truck = TruckRequest(length=10.0, width=2.5, height=2.5)
        print("✅ Truck model created successfully!")
        
        # Test item model
        item = ItemRequest(
            id="test1",
            length=1.0,
            width=0.8,
            height=0.6,
            weight=50.0,
            can_rotate=True
        )
        print("✅ Item model created successfully!")
        
        # Test optimization request model
        request = OptimizationRequest(
            truck=truck,
            items=[item]
        )
        print("✅ Optimization request model created successfully!")
        
        return True
    except Exception as e:
        print(f"❌ Request models test failed: {str(e)}")
        return False

def main():
    """Run all verification tests"""
    print("🧪 Starting API Verification Tests...")
    print("=" * 50)
    
    tests = [
        ("API Import", test_api_import),
        ("Algorithm Integration", test_algorithm_integration),
        ("Request Models", test_request_models)
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
        print("🎉 All verification tests passed!")
        print("✅ API is ready to run!")
        print("\n💡 To start the API server, run:")
        print("   python src/api/main.py")
        print("\n💡 Then visit: http://localhost:8000/api/docs")
    else:
        print("⚠️  Some verification tests failed.")
        print("🔧 Please check the errors above.")

if __name__ == "__main__":
    main() 