"""
Basic tests for the Bin Packer Cloud API

This module contains comprehensive tests for all API endpoints
using pytest and FastAPI TestClient.
"""

import pytest
import sys
import os
from fastapi.testclient import TestClient
from datetime import datetime

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from api.main import app

# Create test client
client = TestClient(app)

class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check_success(self):
        """Test that health check returns 200 and correct data"""
        response = client.get("/api/v1/health")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "status" in data
        assert "timestamp" in data
        assert "version" in data
        assert "algorithm_available" in data
        
        # Check specific values
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert data["algorithm_available"] == True
        
        # Check timestamp format
        timestamp = datetime.fromisoformat(data["timestamp"].replace('Z', '+00:00'))
        assert isinstance(timestamp, datetime)

class TestRootEndpoint:
    """Test root endpoint"""
    
    def test_root_endpoint(self):
        """Test that root endpoint returns API information"""
        response = client.get("/")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "version" in data
        assert "docs" in data
        assert "health" in data
        
        assert data["message"] == "Bin Packer Cloud API"
        assert data["version"] == "1.0.0"

class TestOptimizationEndpoint:
    """Test main optimization endpoint"""
    
    def test_optimization_success(self):
        """Test successful optimization with valid data"""
        test_data = {
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
                }
            ]
        }
        
        response = client.post("/api/v1/optimize", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "success" in data
        assert "efficiency" in data
        assert "total_weight" in data
        assert "truck_dimensions" in data
        assert "placed_items" in data
        assert "unplaced_items" in data
        assert "statistics" in data
        assert "execution_time" in data
        assert "timestamp" in data
        
        # Check data types
        assert isinstance(data["success"], bool)
        assert isinstance(data["efficiency"], (int, float))
        assert isinstance(data["total_weight"], (int, float))
        assert isinstance(data["truck_dimensions"], list)
        assert isinstance(data["placed_items"], list)
        assert isinstance(data["unplaced_items"], list)
        assert isinstance(data["statistics"], dict)
        assert isinstance(data["execution_time"], (int, float))
        
        # Check statistics
        stats = data["statistics"]
        assert "items_placed" in stats
        assert "items_unplaced" in stats
        assert "total_items" in stats
        
        # Check that total items calculation is correct
        assert stats["total_items"] == stats["items_placed"] + stats["items_unplaced"]
        
        # Check that efficiency is reasonable (0-100%)
        assert 0 <= data["efficiency"] <= 100
        
        # Check that execution time is positive
        assert data["execution_time"] >= 0

    def test_optimization_invalid_truck_dimensions(self):
        """Test optimization with invalid truck dimensions"""
        test_data = {
            "truck": {
                "length": -10.0,  # Invalid negative value
                "width": 2.5,
                "height": 2.5
            },
            "items": [
                {
                    "id": "box1",
                    "length": 1.0,
                    "width": 0.8,
                    "height": 0.6,
                    "weight": 50.0
                }
            ]
        }
        
        response = client.post("/api/v1/optimize", json=test_data)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_optimization_invalid_item_dimensions(self):
        """Test optimization with invalid item dimensions"""
        test_data = {
            "truck": {
                "length": 10.0,
                "width": 2.5,
                "height": 2.5
            },
            "items": [
                {
                    "id": "box1",
                    "length": 0.0,  # Invalid zero value
                    "width": 0.8,
                    "height": 0.6,
                    "weight": 50.0
                }
            ]
        }
        
        response = client.post("/api/v1/optimize", json=test_data)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_optimization_empty_items(self):
        """Test optimization with empty items list"""
        test_data = {
            "truck": {
                "length": 10.0,
                "width": 2.5,
                "height": 2.5
            },
            "items": []  # Empty list
        }
        
        response = client.post("/api/v1/optimize", json=test_data)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_optimization_missing_required_fields(self):
        """Test optimization with missing required fields"""
        test_data = {
            "truck": {
                "length": 10.0,
                "width": 2.5
                # Missing height
            },
            "items": [
                {
                    "id": "box1",
                    "length": 1.0,
                    "width": 0.8
                    # Missing height and weight
                }
            ]
        }
        
        response = client.post("/api/v1/optimize", json=test_data)
        
        assert response.status_code == 422  # Validation error
        data = response.json()
        assert "detail" in data

    def test_optimization_large_truck(self):
        """Test optimization with large truck (EU Euroliner dimensions)"""
        test_data = {
            "truck": {
                "length": 13.62,  # EU Euroliner
                "width": 2.48,
                "height": 2.7
            },
            "items": [
                {
                    "id": "pallet1",
                    "length": 1.2,
                    "width": 0.8,
                    "height": 0.15,
                    "weight": 200.0,
                    "can_rotate": False,
                    "is_palletized": True
                },
                {
                    "id": "box1",
                    "length": 0.8,
                    "width": 0.6,
                    "height": 0.5,
                    "weight": 40.0,
                    "can_rotate": True
                }
            ]
        }
        
        response = client.post("/api/v1/optimize", json=test_data)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that at least one item was placed
        assert data["statistics"]["items_placed"] >= 0
        assert data["success"] == True

class TestStatisticsEndpoint:
    """Test statistics endpoint"""
    
    def test_statistics_endpoint(self):
        """Test that statistics endpoint returns correct data"""
        response = client.get("/api/v1/statistics")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "total_optimizations" in data
        assert "total_execution_time" in data
        assert "average_execution_time" in data
        assert "last_updated" in data
        
        # Check data types
        assert isinstance(data["total_optimizations"], int)
        assert isinstance(data["total_execution_time"], (int, float))
        assert isinstance(data["average_execution_time"], (int, float))
        
        # Check that values are non-negative
        assert data["total_optimizations"] >= 0
        assert data["total_execution_time"] >= 0
        assert data["average_execution_time"] >= 0

class TestErrorHandling:
    """Test error handling"""
    
    def test_nonexistent_endpoint(self):
        """Test that nonexistent endpoint returns 404"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404

    def test_invalid_json(self):
        """Test that invalid JSON returns 422"""
        response = client.post(
            "/api/v1/optimize",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422

    def test_wrong_content_type(self):
        """Test that wrong content type returns error"""
        response = client.post(
            "/api/v1/optimize",
            data="some data",
            headers={"Content-Type": "text/plain"}
        )
        assert response.status_code == 422

if __name__ == "__main__":
    # Run tests directly if script is executed
    pytest.main([__file__, "-v"]) 