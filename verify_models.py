#!/usr/bin/env python3
"""
Simple verification script for models
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

try:
    from models import Vehicle, Item, create_default_vehicle
    print("✅ Models imported successfully!")
    
    # Test basic functionality
    vehicle = create_default_vehicle()
    print(f"✅ Vehicle created: {vehicle.name}")
    print(f"   Volume: {vehicle.get_volume_m3():.2f} m³")
    
    item = Item(name="Test", length_mm=1000, width_mm=800, height_mm=600, weight_kg=50.0)
    print(f"✅ Item created: {item.name}")
    print(f"   Volume: {item.get_volume_m3():.3f} m³")
    
    print("\n🎉 All models working correctly!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 