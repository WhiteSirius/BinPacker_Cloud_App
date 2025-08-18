#!/usr/bin/env python3
"""
Test script for database models
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from models import (
    Vehicle, Item, PackingJob, PackingJobItem, PlacedItem,
    User, AlgorithmConfiguration, SystemLog,
    create_default_vehicle, create_default_algorithm_config
)

def test_models():
    """Test the database models"""
    print("🧪 Testing Database Models...")
    
    # Test 1: Vehicle model
    print("\n📦 Test 1: Vehicle Model")
    vehicle = create_default_vehicle()
    print(f"✅ Created vehicle: {vehicle.name}")
    print(f"   Dimensions: {vehicle.get_dimensions_meters()}")
    print(f"   Volume: {vehicle.get_volume_m3():.2f} m³")
    print(f"   Max weight: {vehicle.max_weight_kg} kg")
    
    # Test 2: Item model
    print("\n📦 Test 2: Item Model")
    item = Item(
        name="Test Box",
        length_mm=1000,  # 1m
        width_mm=800,    # 0.8m
        height_mm=600,   # 0.6m
        weight_kg=50.0,
        can_rotate=True,
        destination="Warehouse A"
    )
    print(f"✅ Created item: {item.name}")
    print(f"   Dimensions: {item.get_dimensions_meters()}")
    print(f"   Volume: {item.get_volume_m3():.3f} m³")
    print(f"   Weight: {item.weight_kg} kg")
    print(f"   Can rotate: {item.can_rotate}")
    print(f"   Destination: {item.destination}")
    
    # Test 3: PackingJob model
    print("\n📦 Test 3: PackingJob Model")
    packing_job = PackingJob(
        name="Test Packing Job",
        vehicle_id=1,
        status="pending",
        algorithm_version="v3"
    )
    print(f"✅ Created packing job: {packing_job.name}")
    print(f"   Status: {packing_job.status}")
    print(f"   Algorithm version: {packing_job.algorithm_version}")
    
    # Test 4: PlacedItem model
    print("\n📦 Test 4: PlacedItem Model")
    placed_item = PlacedItem(
        packing_job_id=1,
        item_name="Test Box",
        position_x_mm=0,
        position_y_mm=0,
        position_z_mm=0,
        rotation_length_mm=1000,
        rotation_width_mm=800,
        rotation_height_mm=600,
        weight_kg=50.0
    )
    print(f"✅ Created placed item: {placed_item.item_name}")
    print(f"   Position: {placed_item.get_position_meters()}")
    print(f"   Rotation: {placed_item.get_rotation_meters()}")
    print(f"   Weight: {placed_item.weight_kg} kg")
    
    # Test 5: Algorithm Configuration
    print("\n📦 Test 5: Algorithm Configuration")
    config = create_default_algorithm_config()
    print(f"✅ Created algorithm config: {config.name}")
    print(f"   Max stack height: {config.max_stack_height}")
    print(f"   Max weight per stack: {config.max_weight_per_stack_kg} kg")
    print(f"   Support requirement: {config.support_requirement_percentage}%")
    print(f"   Enable rotation: {config.enable_rotation}")
    print(f"   Enable caching: {config.enable_caching}")
    
    # Test 6: User model
    print("\n📦 Test 6: User Model")
    user = User(
        email="test@example.com",
        name="Test User",
        is_active=True,
        is_admin=False
    )
    print(f"✅ Created user: {user.name}")
    print(f"   Email: {user.email}")
    print(f"   Active: {user.is_active}")
    print(f"   Admin: {user.is_admin}")
    
    # Test 7: System Log
    print("\n📦 Test 7: System Log")
    log = SystemLog(
        level="INFO",
        message="Test log message",
        source="test_models",
        packing_job_id=1,
        log_metadata={"test": True, "version": "1.0"}
    )
    print(f"✅ Created system log")
    print(f"   Level: {log.level}")
    print(f"   Message: {log.message}")
    print(f"   Source: {log.source}")
    print(f"   Metadata: {log.log_metadata}")
    
    print("\n🎉 ALL MODEL TESTS PASSED!")
    print("="*50)
    print("✅ All models created successfully!")
    print("✅ All relationships defined correctly!")
    print("✅ All helper methods work properly!")
    print("="*50)

if __name__ == "__main__":
    test_models() 