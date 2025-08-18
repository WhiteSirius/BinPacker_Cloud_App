#!/usr/bin/env python3
"""
Quick test for the bin packing algorithm
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from algorithm.bin_packer_v3 import BinPackerV3, Item

print("🚀 Testing Bin Packer V3 Algorithm...")

# Create a simple test
truck_length, truck_width, truck_height = 10.0, 2.5, 2.5
packer = BinPackerV3(truck_length, truck_width, truck_height)

items = [
    Item("box1", 1.0, 0.8, 0.6, 50.0, can_rotate=True),
    Item("box2", 0.5, 0.5, 0.5, 25.0, can_rotate=True),
    Item("box3", 0.8, 0.6, 0.5, 40.0, can_rotate=True),
]

print(f"Truck: {truck_length}m x {truck_width}m x {truck_height}m")
print(f"Items to pack: {len(items)}")

# Run algorithm
result = packer.pack_items(items)

print(f"\n✅ Algorithm completed successfully!")
print(f"Efficiency: {result['efficiency']}%")
print(f"Items placed: {result['statistics']['items_placed']}")
print(f"Items unplaced: {result['statistics']['items_unplaced']}")
print(f"Total weight: {result['total_weight']} kg")

if result['placed_items']:
    print("\n📦 Placed Items:")
    for item in result['placed_items']:
        print(f"  {item['id']}: pos({item['position']['x']:.2f}, {item['position']['y']:.2f}, {item['position']['z']:.2f})")

print("\n🎉 Algorithm test completed!") 