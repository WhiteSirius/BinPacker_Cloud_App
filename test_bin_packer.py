#!/usr/bin/env python3
"""
Test script for BinPackerV3
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from algorithm.bin_packer_v3 import BinPackerV3, Item

def test_bin_packer():
    """Test the bin packer with sample data"""
    print("Testing BinPackerV3...")
    
    # Create a sample truck (EU Euroliner dimensions)
    truck_length, truck_width, truck_height = 13.62, 2.48, 2.7
    
    # Create sample items
    items = [
        Item("box1", 1.0, 0.8, 0.6, 50.0, can_rotate=True),
        Item("box2", 1.2, 0.9, 0.7, 60.0, can_rotate=True),
        Item("box3", 0.8, 0.6, 0.5, 40.0, can_rotate=True),
        Item("pallet1", 1.2, 0.8, 0.15, 200.0, can_rotate=False, is_palletized=True),
        Item("box4", 0.5, 0.4, 0.3, 25.0, can_rotate=True),
        Item("box5", 0.7, 0.5, 0.4, 35.0, can_rotate=True),
    ]
    
    print(f"Truck dimensions: {truck_length}m x {truck_width}m x {truck_height}m")
    print(f"Total items to pack: {len(items)}")
    
    # Create packer and run algorithm
    packer = BinPackerV3(truck_length, truck_width, truck_height)
    result = packer.pack_items(items)
    
    # Display results
    print("\n" + "="*50)
    print("PACKING RESULTS")
    print("="*50)
    print(f"Success: {result['success']}")
    print(f"Efficiency: {result['efficiency']}%")
    print(f"Items placed: {result['statistics']['items_placed']}")
    print(f"Items unplaced: {result['statistics']['items_unplaced']}")
    print(f"Total weight: {result['total_weight']} kg")
    
    print("\nPLACED ITEMS:")
    print("-" * 30)
    for item in result['placed_items']:
        print(f"  {item['id']}: pos({item['position']['x']:.2f}, {item['position']['y']:.2f}, {item['position']['z']:.2f})")
        print(f"    Dimensions: {item['dimensions']['length']:.2f} x {item['dimensions']['width']:.2f} x {item['dimensions']['height']:.2f}")
        print(f"    Weight: {item['weight']} kg")
    
    if result['unplaced_items']:
        print("\nUNPLACED ITEMS:")
        print("-" * 30)
        for item in result['unplaced_items']:
            print(f"  {item['id']}: Volume={item['volume']:.3f}m³, Weight={item['weight']}kg")
    
    print("\n" + "="*50)
    print("TEST COMPLETED SUCCESSFULLY!")
    print("="*50)

if __name__ == "__main__":
    test_bin_packer() 