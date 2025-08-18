#!/usr/bin/env python3
"""
Test script for the FastAPI Bin Packer API
"""

import requests
import json
import time
from datetime import datetime

# API base URL
BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing Health Check...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health Check: {data['status']}")
            print(f"   Version: {data['version']}")
            print(f"   Algorithm Available: {data['algorithm_available']}")
            return True
        else:
            print(f"❌ Health Check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Is it running?")
        return False

def test_optimization():
    """Test the main optimization endpoint"""
    print("\n🚀 Testing Optimization Endpoint...")
    
    # Sample request data
    request_data = {
        "truck": {
            "length": 10.0,
            "width": 2.5,
            "height": 2.5
        },
        "items": [
            {
                "id": "box1",
                "length": 1.0,
                "width": 0.8,
                "height": 0.6,
                "weight": 50.0,
                "can_rotate": True,
                "destination": "Bucharest"
            },
            {
                "id": "box2",
                "length": 0.5,
                "width": 0.5,
                "height": 0.5,
                "weight": 25.0,
                "can_rotate": True,
                "destination": "Cluj"
            },
            {
                "id": "pallet1",
                "length": 1.2,
                "width": 0.8,
                "height": 0.15,
                "weight": 200.0,
                "can_rotate": False,
                "is_palletized": True,
                "destination": "Timisoara"
            }
        ],
        "algorithm_config": {
            "max_stack_height": 3,
            "max_weight_per_stack": 1000.0
        }
    }
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/v1/optimize",
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Optimization completed in {end_time - start_time:.3f}s")
            print(f"   Success: {data['success']}")
            print(f"   Efficiency: {data['efficiency']}%")
            print(f"   Total Weight: {data['total_weight']} kg")
            print(f"   Items Placed: {data['statistics']['items_placed']}")
            print(f"   Items Unplaced: {data['statistics']['items_unplaced']}")
            print(f"   Execution Time: {data['execution_time']:.3f}s")
            
            if data['placed_items']:
                print("\n📦 Placed Items:")
                for item in data['placed_items']:
                    pos = item['position']
                    print(f"   {item['id']}: pos({pos['x']:.2f}, {pos['y']:.2f}, {pos['z']:.2f})")
            
            if data['unplaced_items']:
                print("\n❌ Unplaced Items:")
                for item in data['unplaced_items']:
                    print(f"   {item['id']}: Volume={item['volume']:.3f}m³, Weight={item['weight']}kg")
            
            return True
        else:
            print(f"❌ Optimization failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Is it running?")
        return False
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

def test_statistics():
    """Test the statistics endpoint"""
    print("\n📊 Testing Statistics Endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/statistics")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Statistics retrieved")
            print(f"   Total Optimizations: {data['total_optimizations']}")
            print(f"   Total Execution Time: {data['total_execution_time']}s")
            print(f"   Average Execution Time: {data['average_execution_time']}s")
            return True
        else:
            print(f"❌ Statistics failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Is it running?")
        return False

def main():
    """Run all API tests"""
    print("🧪 Starting FastAPI Bin Packer Tests...")
    print(f"📍 API URL: {BASE_URL}")
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Run tests
    tests = [
        ("Health Check", test_health_check),
        ("Optimization", test_optimization),
        ("Statistics", test_statistics)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test crashed: {str(e)}")
    
    print("\n" + "=" * 60)
    print(f"📈 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! API is working correctly!")
    else:
        print("⚠️  Some tests failed. Check the API server.")
    
    print("\n💡 To start the API server, run:")
    print("   python src/api/main.py")
    print("\n💡 Then run this test script again.")

if __name__ == "__main__":
    main() 