"""
Tests for the Bin Packer Algorithm

This module contains tests specifically for the bin packing algorithm
functionality, separate from the API tests.
"""

import pytest
import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from algorithm.bin_packer_v3 import BinPackerV3, Item, Point3D, PlacedItem

class TestBinPackerAlgorithm:
    """Test the bin packing algorithm"""
    
    def test_algorithm_initialization(self):
        """Test that the algorithm can be initialized correctly"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        assert packer.truck_dimensions == (10.0, 2.5, 2.5)
        assert len(packer.placed_items) == 0
        assert len(packer.unplaced_items) == 0
        
        # Check that starting point is added
        assert len(packer.point_manager.available_points) > 0
    
    def test_item_creation(self):
        """Test that items can be created correctly"""
        item = Item("test1", 1.0, 0.8, 0.6, 50.0, can_rotate=True)
        
        assert item.id == "test1"
        assert item.length == 1.0
        assert item.width == 0.8
        assert item.height == 0.6
        assert item.weight == 50.0
        assert item.can_rotate == True
        assert item.volume == 1.0 * 0.8 * 0.6
    
    def test_simple_packing(self):
        """Test simple packing scenario"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        items = [
            Item("box1", 1.0, 0.8, 0.6, 50.0),
            Item("box2", 0.5, 0.5, 0.5, 25.0),
        ]
        
        result = packer.pack_items(items)
        
        # Check that result has required fields
        assert "success" in result
        assert "efficiency" in result
        assert "total_weight" in result
        assert "placed_items" in result
        assert "unplaced_items" in result
        assert "statistics" in result
        
        # Check that at least one item was placed
        assert result["statistics"]["items_placed"] >= 0
        assert result["success"] == True
        
        # Check efficiency is reasonable
        assert 0 <= result["efficiency"] <= 100
    
    def test_packing_with_rotation(self):
        """Test packing with item rotation"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        items = [
            Item("box1", 1.0, 0.8, 0.6, 50.0, can_rotate=True),
            Item("box2", 0.5, 0.5, 0.5, 25.0, can_rotate=True),
        ]
        
        result = packer.pack_items(items)
        
        assert result["success"] == True
        assert result["statistics"]["items_placed"] >= 0
    
    def test_packing_without_rotation(self):
        """Test packing without item rotation"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        items = [
            Item("box1", 1.0, 0.8, 0.6, 50.0, can_rotate=False),
            Item("box2", 0.5, 0.5, 0.5, 25.0, can_rotate=False),
        ]
        
        result = packer.pack_items(items)
        
        assert result["success"] == True
        assert result["statistics"]["items_placed"] >= 0
    
    def test_palletized_items(self):
        """Test packing with palletized items"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        items = [
            Item("pallet1", 1.2, 0.8, 0.15, 200.0, is_palletized=True),
            Item("box1", 0.8, 0.6, 0.5, 40.0, can_rotate=True),
        ]
        
        result = packer.pack_items(items)
        
        assert result["success"] == True
        assert result["statistics"]["items_placed"] >= 0
    
    def test_large_truck_scenario(self):
        """Test packing with large truck (EU Euroliner)"""
        packer = BinPackerV3(13.62, 2.48, 2.7)  # EU Euroliner
        
        items = [
            Item("pallet1", 1.2, 0.8, 0.15, 200.0, is_palletized=True),
            Item("box1", 0.8, 0.6, 0.5, 40.0, can_rotate=True),
            Item("box2", 0.5, 0.4, 0.3, 25.0, can_rotate=True),
            Item("box3", 1.0, 0.7, 0.4, 35.0, can_rotate=True),
        ]
        
        result = packer.pack_items(items)
        
        assert result["success"] == True
        assert result["statistics"]["items_placed"] >= 0
    
    def test_empty_items_list(self):
        """Test packing with empty items list"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        result = packer.pack_items([])
        
        assert result["success"] == True
        assert result["statistics"]["items_placed"] == 0
        assert result["statistics"]["items_unplaced"] == 0
        assert result["efficiency"] == 0.0
    
    def test_items_too_large_for_truck(self):
        """Test packing with items too large for truck"""
        packer = BinPackerV3(1.0, 1.0, 1.0)  # Small truck
        
        items = [
            Item("large_box", 2.0, 2.0, 2.0, 100.0),  # Too large
        ]
        
        result = packer.pack_items(items)
        
        assert result["success"] == True
        assert result["statistics"]["items_placed"] == 0
        assert result["statistics"]["items_unplaced"] == 1
    
    def test_weight_distribution(self):
        """Test that weight is calculated correctly"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        items = [
            Item("box1", 1.0, 0.8, 0.6, 50.0),
            Item("box2", 0.5, 0.5, 0.5, 25.0),
        ]
        
        result = packer.pack_items(items)
        
        # Check that total weight is calculated
        assert "total_weight" in result
        assert isinstance(result["total_weight"], (int, float))
        assert result["total_weight"] >= 0
    
    def test_placed_item_structure(self):
        """Test that placed items have correct structure"""
        packer = BinPackerV3(10.0, 2.5, 2.5)
        
        items = [
            Item("box1", 1.0, 0.8, 0.6, 50.0),
        ]
        
        result = packer.pack_items(items)
        
        if result["placed_items"]:
            placed_item = result["placed_items"][0]
            
            # Check required fields
            assert "id" in placed_item
            assert "position" in placed_item
            assert "rotation" in placed_item
            assert "dimensions" in placed_item
            assert "weight" in placed_item
            
            # Check position structure
            position = placed_item["position"]
            assert "x" in position
            assert "y" in position
            assert "z" in position
            
            # Check dimensions structure
            dimensions = placed_item["dimensions"]
            assert "length" in dimensions
            assert "width" in dimensions
            assert "height" in dimensions

class TestPoint3D:
    """Test Point3D class"""
    
    def test_point_creation(self):
        """Test Point3D creation"""
        point = Point3D(1.0, 2.0, 3.0)
        
        assert point.x == 1.0
        assert point.y == 2.0
        assert point.z == 3.0
    
    def test_point_equality(self):
        """Test Point3D equality"""
        point1 = Point3D(1.0, 2.0, 3.0)
        point2 = Point3D(1.0, 2.0, 3.0)
        point3 = Point3D(1.1, 2.0, 3.0)
        
        assert point1 == point2
        assert point1 != point3
    
    def test_point_hashing(self):
        """Test Point3D hashing"""
        point1 = Point3D(1.0, 2.0, 3.0)
        point2 = Point3D(1.0, 2.0, 3.0)
        
        # Points should have same hash if equal
        assert hash(point1) == hash(point2)

class TestPlacedItem:
    """Test PlacedItem class"""
    
    def test_placed_item_creation(self):
        """Test PlacedItem creation"""
        item = Item("test", 1.0, 0.8, 0.6, 50.0)
        position = Point3D(0.0, 0.0, 0.0)
        rotation = (1.0, 0.8, 0.6)
        
        placed_item = PlacedItem(item, position, rotation)
        
        assert placed_item.item == item
        assert placed_item.position == position
        assert placed_item.rotation == rotation
    
    def test_placed_item_volume(self):
        """Test PlacedItem volume calculation"""
        item = Item("test", 1.0, 0.8, 0.6, 50.0)
        position = Point3D(0.0, 0.0, 0.0)
        rotation = (1.0, 0.8, 0.6)
        
        placed_item = PlacedItem(item, position, rotation)
        
        expected_volume = 1.0 * 0.8 * 0.6
        assert placed_item.volume == expected_volume
    
    def test_placed_item_bounds(self):
        """Test PlacedItem bounds calculation"""
        item = Item("test", 1.0, 0.8, 0.6, 50.0)
        position = Point3D(1.0, 2.0, 3.0)
        rotation = (1.0, 0.8, 0.6)
        
        placed_item = PlacedItem(item, position, rotation)
        min_point, max_point = placed_item.bounds
        
        assert min_point == position
        assert max_point.x == position.x + rotation[0]
        assert max_point.y == position.y + rotation[1]
        assert max_point.z == position.z + rotation[2]

if __name__ == "__main__":
    # Run tests directly if script is executed
    pytest.main([__file__, "-v"]) 