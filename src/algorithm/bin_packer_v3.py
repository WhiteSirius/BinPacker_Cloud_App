"""
Bin Packer V3 - Clean Implementation of Improved Collision Points Algorithm

This module implements a refined version of the collision points algorithm
with clear logic flow, modular design, and comprehensive constraint handling.

Based on the Algorithm Improved Logic Analysis document.
"""

from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass, field
from enum import Enum
import logging
import math
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConstraintType(Enum):
    """Types of constraints that can be violated"""
    GEOMETRIC = "geometric"
    COLLISION = "collision"
    SUPPORT = "support"
    WEIGHT = "weight"
    ROTATION = "rotation"


class Stackability(Enum):
    """Stacking behavior of an item"""
    STACKABLE = "stackable"            # default: can have items above and below
    SEMI_STACKABLE = "semi_stackable"  # can be placed above, but cannot have anything above it
    UNSTACKABLE = "unstackable"        # must be on floor; blocks entire width for its length

class PlacementResult:
    """Result of a placement attempt"""
    def __init__(self, success: bool, reason: str = "", placed_item: Optional['PlacedItem'] = None):
        self.success = success
        self.reason = reason
        self.placed_item = placed_item

@dataclass
class Point3D:
    """3D point representation"""
    x: float
    y: float
    z: float
    
    def __hash__(self):
        return hash((round(self.x, 3), round(self.y, 3), round(self.z, 3)))
    
    def __eq__(self, other):
        if not isinstance(other, Point3D):
            return False
        return (round(self.x, 3) == round(other.x, 3) and 
                round(self.y, 3) == round(other.y, 3) and 
                round(self.z, 3) == round(other.z, 3))

@dataclass
class Item:
    """Represents an item to be packed"""
    id: str
    length: float
    width: float
    height: float
    weight: float
    can_rotate: bool = True
    destination: str = ""
    is_palletized: bool = False  # kept for backward-compat; ignored by rotation logic
    stackability: Stackability = Stackability.STACKABLE
    
    @property
    def volume(self) -> float:
        return self.length * self.width * self.height
    
    @property
    def base_area(self) -> float:
        return self.length * self.width
    
    def get_rotations(self) -> List[Tuple[float, float, float]]:
        """Return limited rotations for palletized-like items: swap length/width only.

        We assume cargo is on pallets, so height orientation remains fixed. Two options:
        - (length, width, height)
        - (width, length, height)
        """
        return [
            (self.length, self.width, self.height),
            (self.width, self.length, self.height),
        ]

@dataclass
class PlacedItem:
    """Represents an item that has been placed in the truck"""
    item: Item
    position: Point3D
    rotation: Tuple[float, float, float] = field(default_factory=lambda: (0, 0, 0))
    
    @property
    def bounds(self) -> Tuple[Point3D, Point3D]:
        """Get the bounding box of the placed item"""
        min_point = self.position
        max_point = Point3D(
            self.position.x + self.rotation[0],
            self.position.y + self.rotation[1],
            self.position.z + self.rotation[2]
        )
        return (min_point, max_point)
    
    def get_corner_points(self) -> List[Point3D]:
        """Get the 8 corner points of the placed item"""
        l, w, h = self.rotation
        corners = [
            Point3D(self.position.x, self.position.y, self.position.z),                    # Bottom-front-left
            Point3D(self.position.x + l, self.position.y, self.position.z),                # Bottom-front-right
            Point3D(self.position.x, self.position.y + w, self.position.z),                # Bottom-back-left
            Point3D(self.position.x + l, self.position.y + w, self.position.z),            # Bottom-back-right
            Point3D(self.position.x, self.position.y, self.position.z + h),                # Top-front-left
            Point3D(self.position.x + l, self.position.y, self.position.z + h),            # Top-front-right
            Point3D(self.position.x, self.position.y + w, self.position.z + h),            # Top-back-left
            Point3D(self.position.x + l, self.position.y + w, self.position.z + h),        # Top-back-right
        ]
        return corners
    
    @property
    def volume(self) -> float:
        """Get the volume of the placed item (after rotation)"""
        l, w, h = self.rotation
        return l * w * h

class PointManager:
    """Manages available placement points with spatial awareness"""
    
    def __init__(self):
        self.available_points: List[Point3D] = []
        self.used_points: List[Point3D] = []
        self.blocked_points: List[Point3D] = []
        self.point_priorities: Dict[Point3D, int] = {}
    
    def add_point(self, point: Point3D, priority: int = 0):
        """Add a new available point"""
        if point not in self.available_points and point not in self.used_points:
            self.available_points.append(point)
            self.point_priorities[point] = priority
    
    def get_next_point(self) -> Optional[Point3D]:
        """Get the next point with highest priority"""
        if not self.available_points:
            return None
        
        # Sort by spatial scan order: within a fixed x-plane, sweep width (y) across each height (z),
        # and only after exhausting (y,z) move forward along length (x).
        # Final tiebreaker by explicit priority (lower number = earlier).
        self.available_points.sort(
            key=lambda p: (
                round(p.x, 6),   # length axis last to advance
                round(p.z, 6),   # height axis second
                round(p.y, 6),   # width axis first within each (x,z)
                self.point_priorities.get(p, 999)
            )
        )
        return self.available_points[0]
    
    def mark_point_used(self, point: Point3D):
        """Mark a point as used"""
        if point in self.available_points:
            self.available_points.remove(point)
        self.used_points.append(point)
    
    def mark_point_blocked(self, point: Point3D):
        """Mark a point as blocked"""
        if point in self.available_points:
            self.available_points.remove(point)
        self.blocked_points.append(point)
    
    def generate_new_points(self, placed_item: PlacedItem) -> List[Point3D]:
        """Generate new candidate points considering stackability rules.

        Baseline candidates:
          - Next width point:  (x, y + w, z)
          - Next height point: (x, y, z + h)
          - Next length point: (x + l, y, z)

        Modifications:
          - SEMI_STACKABLE: do not generate top point (no items above this one)
          - UNSTACKABLE: do not generate top point; also block width alongside this item's length span
        """
        x, y, z = placed_item.position.x, placed_item.position.y, placed_item.position.z
        l, w, h = placed_item.rotation

        candidates: List[Point3D] = [
            Point3D(x, y + w, z),  # advance along width first
            Point3D(x + l, y, z),  # then length
        ]

        # Only stackable items generate the top surface point
        if placed_item.item.stackability == Stackability.STACKABLE:
            candidates.insert(1, Point3D(x, y, z + h))  # between width and length per sweep order

        # Do not generate top point for semi/unstackable (already handled). No extra blocked points here.

        new_points: List[Point3D] = []
        for point in candidates:
            if point not in self.available_points and point not in self.used_points and point not in self.blocked_points:
                new_points.append(point)

        return new_points

class CollisionDetector:
    """Advanced collision detection with spatial indexing"""
    
    def __init__(self):
        self.placed_items: List[PlacedItem] = []
        self.collision_cache: Dict[str, bool] = {}
    
    def add_placed_item(self, placed_item: PlacedItem):
        """Add a placed item to collision detection"""
        self.placed_items.append(placed_item)
        self.collision_cache.clear()  # Clear cache when new item is added
    
    def check_collision(self, item: Item, position: Point3D, rotation: Tuple[float, float, float]) -> bool:
        """Check if placing an item would cause a collision"""
        cache_key = f"{item.id}_{position.x}_{position.y}_{position.z}_{rotation}"
        
        if cache_key in self.collision_cache:
            return self.collision_cache[cache_key]
        
        # Create temporary placed item for collision checking
        temp_placed = PlacedItem(item, position, rotation)
        temp_bounds = temp_placed.bounds
        
        # Check collision with all placed items
        for placed_item in self.placed_items:
            if self._aabb_collision(temp_bounds, placed_item.bounds):
                self.collision_cache[cache_key] = True
                return True
        
        self.collision_cache[cache_key] = False
        return False
    
    def _aabb_collision(self, bounds1: Tuple[Point3D, Point3D], bounds2: Tuple[Point3D, Point3D]) -> bool:
        """Axis-Aligned Bounding Box collision detection"""
        min1, max1 = bounds1
        min2, max2 = bounds2
        
        return not (max1.x <= min2.x or min1.x >= max2.x or
                   max1.y <= min2.y or min1.y >= max2.y or
                   max1.z <= min2.z or min1.z >= max2.z)

class SupportValidator:
    """Validates 100% support requirement with geometric precision"""
    
    def __init__(self):
        self.placed_items: List[PlacedItem] = []
    
    def add_placed_item(self, placed_item: PlacedItem):
        """Add a placed item for support validation"""
        self.placed_items.append(placed_item)
    
    def validate_support(self, item: Item, position: Point3D, rotation: Tuple[float, float, float]) -> bool:
        """Check if item has 100% support at placement point"""
        if position.z == 0:
            return True  # Items on the floor have 100% support
        
        # Get support surface at item's base height
        support_surface = self._get_support_surface(position.z)
        
        if not support_surface:
            return False
        
        # Calculate support percentage
        # Semi-stackable and unstackable cannot have anything above them.
        # Validation for support is for the current item; blocking above is handled separately.
        support_percentage = self._calculate_support_percentage(item, position, rotation, support_surface)
        return support_percentage >= 100.0
    
    def _get_support_surface(self, height: float) -> List[Tuple[Point3D, Point3D]]:
        """Get all support surfaces at a given height"""
        support_surfaces = []
        
        for placed_item in self.placed_items:
            if placed_item.position.z + placed_item.rotation[2] == height:
                # This item provides support at the given height
                min_point = placed_item.position
                max_point = Point3D(
                    min_point.x + placed_item.rotation[0],
                    min_point.y + placed_item.rotation[1],
                    min_point.z + placed_item.rotation[2]
                )
                support_surfaces.append((min_point, max_point))
        
        return support_surfaces
    
    def _calculate_support_percentage(self, item: Item, position: Point3D, rotation: Tuple[float, float, float], 
                                    support_surfaces: List[Tuple[Point3D, Point3D]]) -> float:
        """Calculate exact percentage of item supported"""
        item_base_area = rotation[0] * rotation[1]  # length * width
        supported_area = 0.0
        
        # Calculate intersection area with each support surface
        for support_min, support_max in support_surfaces:
            intersection_area = self._calculate_intersection_area(
                (position, Point3D(position.x + rotation[0], position.y + rotation[1], position.z)),
                (support_min, support_max)
            )
            supported_area += intersection_area
        
        return (supported_area / item_base_area) * 100.0 if item_base_area > 0 else 0.0
    
    def _calculate_intersection_area(self, item_bounds: Tuple[Point3D, Point3D], 
                                   support_bounds: Tuple[Point3D, Point3D]) -> float:
        """Calculate intersection area between two rectangles"""
        item_min, item_max = item_bounds
        support_min, support_max = support_bounds
        
        # Calculate intersection in X and Y dimensions
        x_overlap = max(0, min(item_max.x, support_max.x) - max(item_min.x, support_min.x))
        y_overlap = max(0, min(item_max.y, support_max.y) - max(item_min.y, support_min.y))
        
        return x_overlap * y_overlap

class WeightManager:
    """Manages weight distribution and stacking constraints"""
    
    def __init__(self, max_stack_height: int = 3, max_weight_per_stack: float = 1000.0):
        self.max_stack_height = max_stack_height
        self.max_weight_per_stack = max_weight_per_stack
        self.placed_items: List[PlacedItem] = []
    
    def add_placed_item(self, placed_item: PlacedItem):
        """Add a placed item for weight management"""
        self.placed_items.append(placed_item)
    
    def validate_placement(self, item: Item, position: Point3D, rotation: Tuple[float, float, float]) -> bool:
        """Validate weight constraints for item placement"""
        # Check stacking height
        if not self._check_stack_height(position):
            return False
        
        # Check weight limits
        if not self._check_weight_limits(item, position):
            return False
        
        return True
    
    def _check_stack_height(self, position: Point3D) -> bool:
        """Check if placement would exceed maximum stack height"""
        if position.z == 0:
            return True
        
        # Count items in the stack at this position
        stack_height = 0
        for placed_item in self.placed_items:
            if (placed_item.position.x == position.x and 
                placed_item.position.y == position.y):
                stack_height += 1
        
        return stack_height < self.max_stack_height
    
    def _check_weight_limits(self, item: Item, position: Point3D) -> bool:
        """Check if placement would exceed weight limits"""
        # Calculate total weight in the stack
        total_weight = item.weight
        for placed_item in self.placed_items:
            if (placed_item.position.x == position.x and 
                placed_item.position.y == position.y):
                total_weight += placed_item.item.weight
        
        return total_weight <= self.max_weight_per_stack

class BinPackerV3:
    """
    Clean implementation of the improved collision points algorithm
    """
    
    def __init__(self, truck_length: float, truck_width: float, truck_height: float):
        self.truck_dimensions = (truck_length, truck_width, truck_height)
        self.placed_items: List[PlacedItem] = []
        self.unplaced_items: List[Item] = []
        
        # Initialize managers
        self.point_manager = PointManager()
        self.collision_detector = CollisionDetector()
        self.support_validator = SupportValidator()
        self.weight_manager = WeightManager()
        
        # Initialize with starting point
        self.point_manager.add_point(Point3D(0, 0, 0), priority=0)
        
        logger.info(f"Initialized BinPackerV3 with truck dimensions: {self.truck_dimensions}")
    
    def pack_items(self, items: List[Item]) -> Dict[str, Any]:
        """
        Main packing algorithm - clean and modular implementation
        """
        logger.info(f"Starting packing algorithm with {len(items)} items")
        
        # Sort items by priority (volume, weight, destination)
        sorted_items = self._sort_items_by_priority(items)
        self.unplaced_items = sorted_items.copy()
        
        # Main packing loop
        while self.point_manager.available_points and self.unplaced_items:
            current_point = self.point_manager.get_next_point()
            if not current_point:
                break
            
            placed_item = self._try_place_item_at_point(current_point)
            
            if placed_item:
                self._handle_successful_placement(placed_item, current_point)
                logger.info(f"Successfully placed item {placed_item.item.id} at {current_point}")
            else:
                self._handle_failed_placement(current_point)
                logger.info(f"Failed to place any item at {current_point}")
        
        # Generate results
        return self._generate_packing_result()
    
    def _sort_items_by_priority(self, items: List[Item]) -> List[Item]:
        """Sort items by priority with stackability precedence.

        Priority order:
          1) Unstackable first
          2) Semi-stackable second
          3) Stackable last
          4) Within each group: by volume desc, then weight desc, then destination
        """
        stack_rank = {
            Stackability.UNSTACKABLE: 0,
            Stackability.STACKABLE: 1,
            Stackability.SEMI_STACKABLE: 2,
        }
        return sorted(
            items,
            key=lambda x: (stack_rank.get(x.stackability, 2), -x.volume, -x.weight, x.destination)
        )
    
    def _try_place_item_at_point(self, point: Point3D) -> Optional[PlacedItem]:
        """Try to place an item at a specific point"""
        for item in self.unplaced_items:
            # Get valid rotations for the item
            rotations = item.get_rotations()
            
            for rotation in rotations:
                # Try placement with this rotation
                placement_result = self._attempt_placement(item, point, rotation)
                
                if placement_result.success:
                    return placement_result.placed_item
        
        return None
    
    def _attempt_placement(self, item: Item, point: Point3D, rotation: Tuple[float, float, float]) -> PlacementResult:
        """Attempt to place an item with specific rotation"""
        # Enforce unstackable: must be placed on the floor
        if item.stackability == Stackability.UNSTACKABLE and point.z != 0:
            return PlacementResult(success=False, reason="unstackable_must_be_floor")

        # Check geometric constraints
        if not self._check_geometric_constraints(item, point, rotation):
            return PlacementResult(success=False, reason="geometric_violation")
        
        # Check collision constraints
        if self.collision_detector.check_collision(item, point, rotation):
            return PlacementResult(success=False, reason="collision")
        
        # Check support constraints
        if not self.support_validator.validate_support(item, point, rotation):
            return PlacementResult(success=False, reason="insufficient_support")
        
        # Check weight constraints
        if not self.weight_manager.validate_placement(item, point, rotation):
            return PlacementResult(success=False, reason="weight_violation")
        
        # All constraints satisfied - place the item
        placed_item = PlacedItem(item, point, rotation)
        return PlacementResult(success=True, placed_item=placed_item)
    
    def _check_geometric_constraints(self, item: Item, point: Point3D, rotation: Tuple[float, float, float]) -> bool:
        """Check if item fits within truck boundaries"""
        truck_l, truck_w, truck_h = self.truck_dimensions
        item_l, item_w, item_h = rotation
        
        # Check if item fits in truck dimensions
        if (point.x + item_l > truck_l or 
            point.y + item_w > truck_w or 
            point.z + item_h > truck_h or
            point.x < 0 or point.y < 0 or point.z < 0):
            return False
        
        return True
    
    def _handle_successful_placement(self, placed_item: PlacedItem, point: Point3D):
        """Handle successful item placement"""
        # Add to placed items
        self.placed_items.append(placed_item)
        
        # Remove from unplaced items
        self.unplaced_items.remove(placed_item.item)
        
        # Mark point as used
        self.point_manager.mark_point_used(point)
        
        # Add to managers
        self.collision_detector.add_placed_item(placed_item)
        self.support_validator.add_placed_item(placed_item)
        self.weight_manager.add_placed_item(placed_item)
        
        # Generate new points
        new_points = self.point_manager.generate_new_points(placed_item)
        for i, new_point in enumerate(new_points):
            self.point_manager.add_point(new_point, priority=i+1)
    
    def _handle_failed_placement(self, point: Point3D):
        """Handle failed placement attempt"""
        self.point_manager.mark_point_blocked(point)
    
    def _generate_packing_result(self) -> Dict[str, Any]:
        """Generate comprehensive packing result"""
        # Calculate packing efficiency
        total_volume = self.truck_dimensions[0] * self.truck_dimensions[1] * self.truck_dimensions[2]
        used_volume = sum(item.volume for item in self.placed_items)
        efficiency = (used_volume / total_volume) * 100 if total_volume > 0 else 0
        
        # Calculate weight distribution
        total_weight = sum(item.item.weight for item in self.placed_items)
        
        return {
            "success": True,
            "placed_items": [
                {
                    "id": item.item.id,
                    "stackability": item.item.stackability.value,
                    "position": {"x": item.position.x, "y": item.position.y, "z": item.position.z},
                    "rotation": item.rotation,
                    "dimensions": {"length": item.rotation[0], "width": item.rotation[1], "height": item.rotation[2]},
                    "weight": item.item.weight
                }
                for item in self.placed_items
            ],
            "unplaced_items": [{"id": item.id, "volume": item.volume, "weight": item.weight, "stackability": item.stackability.value} for item in self.unplaced_items],
            "efficiency": round(efficiency, 2),
            "total_weight": total_weight,
            "truck_dimensions": self.truck_dimensions,
            "statistics": {
                "items_placed": len(self.placed_items),
                "items_unplaced": len(self.unplaced_items),
                "total_items": len(self.placed_items) + len(self.unplaced_items)
            }
        }

# Example usage and testing
if __name__ == "__main__":
    # Create a sample truck
    truck_length, truck_width, truck_height = 13.62, 2.48, 2.7  # EU Euroliner dimensions
    
    # Create sample items
    items = [
        Item("box1", 1.0, 0.8, 0.6, 50.0, can_rotate=True),
        Item("box2", 1.2, 0.9, 0.7, 60.0, can_rotate=True),
        Item("box3", 0.8, 0.6, 0.5, 40.0, can_rotate=True),
        Item("pallet1", 1.2, 0.8, 0.15, 200.0, can_rotate=False, is_palletized=True),
    ]
    
    # Create packer and run algorithm
    packer = BinPackerV3(truck_length, truck_width, truck_height)
    result = packer.pack_items(items)
    
    print("Packing Result:")
    print(f"Efficiency: {result['efficiency']}%")
    print(f"Items placed: {result['statistics']['items_placed']}")
    print(f"Items unplaced: {result['statistics']['items_unplaced']}")
    print(f"Total weight: {result['total_weight']} kg")
    
    print("\nPlaced Items:")
    for item in result['placed_items']:
        print(f"  {item['id']}: pos({item['position']['x']:.2f}, {item['position']['y']:.2f}, {item['position']['z']:.2f})") 