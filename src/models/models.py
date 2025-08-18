"""
Database Models for Bin Packer Cloud Application

This module defines all database models using SQLAlchemy ORM.
Models are designed to support the 3D bin packing algorithm and cloud deployment.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Vehicle(Base):
    """Vehicle/Truck model for transportation"""
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    length_mm = Column(Integer, nullable=False)  # Length in millimeters
    width_mm = Column(Integer, nullable=False)   # Width in millimeters
    height_mm = Column(Integer, nullable=False)  # Height in millimeters
    max_weight_kg = Column(Float, nullable=False)  # Maximum weight capacity
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    packing_jobs = relationship("PackingJob", back_populates="vehicle")
    
    def get_dimensions_meters(self) -> tuple:
        """Get dimensions in meters"""
        return (
            self.length_mm / 1000.0,
            self.width_mm / 1000.0,
            self.height_mm / 1000.0
        )
    
    def get_volume_m3(self) -> float:
        """Get volume in cubic meters"""
        l, w, h = self.get_dimensions_meters()
        return l * w * h

class Item(Base):
    """Item model for objects to be packed"""
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    length_mm = Column(Integer, nullable=False)
    width_mm = Column(Integer, nullable=False)
    height_mm = Column(Integer, nullable=False)
    weight_kg = Column(Float, nullable=False)
    can_rotate = Column(Boolean, default=True)
    is_palletized = Column(Boolean, default=False)
    destination = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    packing_job_items = relationship("PackingJobItem", back_populates="item")
    
    def get_dimensions_meters(self) -> tuple:
        """Get dimensions in meters"""
        return (
            self.length_mm / 1000.0,
            self.width_mm / 1000.0,
            self.height_mm / 1000.0
        )
    
    def get_volume_m3(self) -> float:
        """Get volume in cubic meters"""
        l, w, h = self.get_dimensions_meters()
        return l * w * h

class PackingJob(Base):
    """Packing job model for algorithm execution"""
    __tablename__ = "packing_jobs"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    algorithm_version = Column(String(50), default="v3")
    efficiency_percentage = Column(Float, nullable=True)
    total_weight_kg = Column(Float, nullable=True)
    items_placed_count = Column(Integer, default=0)
    items_unplaced_count = Column(Integer, default=0)
    execution_time_ms = Column(Integer, nullable=True)  # Execution time in milliseconds
    result_data = Column(JSON, nullable=True)  # Full algorithm result
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="packing_jobs")
    items = relationship("PackingJobItem", back_populates="packing_job")
    placed_items = relationship("PlacedItem", back_populates="packing_job")

class PackingJobItem(Base):
    """Many-to-many relationship between PackingJob and Item with quantity"""
    __tablename__ = "packing_job_items"
    
    id = Column(Integer, primary_key=True)
    packing_job_id = Column(Integer, ForeignKey("packing_jobs.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    stackability = Column(String(32), default="stackable")
    destination = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    packing_job = relationship("PackingJob", back_populates="items")
    item = relationship("Item", back_populates="packing_job_items")

class PlacedItem(Base):
    """Placed item model for algorithm results"""
    __tablename__ = "placed_items"
    
    id = Column(Integer, primary_key=True)
    packing_job_id = Column(Integer, ForeignKey("packing_jobs.id"), nullable=False)
    item_name = Column(String(255), nullable=False)  # Redundant but useful for queries
    position_x_mm = Column(Integer, nullable=False)  # X position in millimeters
    position_y_mm = Column(Integer, nullable=False)  # Y position in millimeters
    position_z_mm = Column(Integer, nullable=False)  # Z position in millimeters
    rotation_length_mm = Column(Integer, nullable=False)  # Length after rotation
    rotation_width_mm = Column(Integer, nullable=False)   # Width after rotation
    rotation_height_mm = Column(Integer, nullable=False)  # Height after rotation
    weight_kg = Column(Float, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    packing_job = relationship("PackingJob", back_populates="placed_items")
    
    def get_position_meters(self) -> tuple:
        """Get position in meters"""
        return (
            self.position_x_mm / 1000.0,
            self.position_y_mm / 1000.0,
            self.position_z_mm / 1000.0
        )
    
    def get_rotation_meters(self) -> tuple:
        """Get rotation dimensions in meters"""
        return (
            self.rotation_length_mm / 1000.0,
            self.rotation_width_mm / 1000.0,
            self.rotation_height_mm / 1000.0
        )

class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    packing_jobs = relationship("UserPackingJob", back_populates="user")

class UserPackingJob(Base):
    """Many-to-many relationship between User and PackingJob"""
    __tablename__ = "user_packing_jobs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    packing_job_id = Column(Integer, ForeignKey("packing_jobs.id"), nullable=False)
    role = Column(String(50), default="owner")  # owner, viewer, editor
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="packing_jobs")
    packing_job = relationship("PackingJob")

class AlgorithmConfiguration(Base):
    """Configuration model for algorithm parameters"""
    __tablename__ = "algorithm_configurations"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    max_stack_height = Column(Integer, default=3)
    max_weight_per_stack_kg = Column(Float, default=1000.0)
    support_requirement_percentage = Column(Float, default=100.0)
    enable_rotation = Column(Boolean, default=True)
    enable_caching = Column(Boolean, default=True)
    priority_volume_weight = Column(Float, default=0.7)  # Weight for volume in priority calculation
    priority_weight_weight = Column(Float, default=0.3)  # Weight for weight in priority calculation
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class SystemLog(Base):
    """System log model for monitoring and debugging"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True)
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR, DEBUG
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)  # algorithm, api, database, etc.
    packing_job_id = Column(Integer, ForeignKey("packing_jobs.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    log_metadata = Column(JSON, nullable=True)  # Additional context data (renamed from metadata)
    created_at = Column(DateTime, server_default=func.now())

# Helper functions for model operations
def create_default_vehicle():
    """Create a default EU Euroliner vehicle"""
    return Vehicle(
        name="EU Euroliner",
        length_mm=13620,  # 13.62m
        width_mm=2480,    # 2.48m
        height_mm=2700,   # 2.7m
        max_weight_kg=24000,  # 24 tons
        description="Standard EU Euroliner truck dimensions"
    )

def create_default_algorithm_config():
    """Create default algorithm configuration"""
    return AlgorithmConfiguration(
        name="Default Configuration",
        max_stack_height=3,
        max_weight_per_stack_kg=1000.0,
        support_requirement_percentage=100.0,
        enable_rotation=True,
        enable_caching=True,
        priority_volume_weight=0.7,
        priority_weight_weight=0.3,
        is_default=True
    ) 