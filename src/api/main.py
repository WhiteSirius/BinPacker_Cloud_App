"""
FastAPI Main Application for Bin Packer Cloud App

This module provides the main API endpoints for the 3D bin packing optimization service.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import sys
import os
from datetime import datetime

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from algorithm.bin_packer_v3 import BinPackerV3, Item, Stackability
from models.models import Base, PackingJob, PackingJobItem, Vehicle, create_default_vehicle
from models.models import Item as ORMItem
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Bin Packer Cloud API",
    description="3D Bin Packing Optimization Service for Truck Loading",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)
# Simple SQLite engine for local dev (swap with Postgres in Cloud SQL later)
DATABASE_URL = "sqlite:///./local.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class ItemRequest(BaseModel):
    """Item data for packing optimization"""
    id: str = Field(..., description="Unique identifier for the item")
    length: float = Field(..., gt=0, description="Length in meters")
    width: float = Field(..., gt=0, description="Width in meters")
    height: float = Field(..., gt=0, description="Height in meters")
    weight: float = Field(..., gt=0, description="Weight in kilograms")
    can_rotate: bool = Field(True, description="Whether item can be rotated")
    destination: str = Field("", description="Destination for the item")
    is_palletized: bool = Field(False, description="Deprecated: kept for backward-compat")
    stackability: Optional[str] = Field('stackable', description="stackable | semi_stackable | unstackable")
    
    @validator('length', 'width', 'height', 'weight')
    def validate_positive_values(cls, v):
        if v <= 0:
            raise ValueError('All dimensions and weight must be positive')
        return v

class TruckRequest(BaseModel):
    """Truck dimensions for packing optimization"""
    length: float = Field(..., gt=0, description="Truck length in meters")
    width: float = Field(..., gt=0, description="Truck width in meters")
    height: float = Field(..., gt=0, description="Truck height in meters")
    
    @validator('length', 'width', 'height')
    def validate_positive_values(cls, v):
        if v <= 0:
            raise ValueError('All truck dimensions must be positive')
        return v

class OptimizationRequest(BaseModel):
    """Main request model for packing optimization"""
    truck: Optional[TruckRequest] = Field(None, description="Truck dimensions")
    items: Optional[List[ItemRequest]] = Field(None, description="Items to pack")
    job_id: Optional[int] = Field(None, description="Existing packing job id")
    algorithm_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Algorithm configuration")
    
    @validator('items')
    def validate_items(cls, v):
        if not v:
            raise ValueError('At least one item must be provided')
        return v

class PlacedItemResponse(BaseModel):
    """Response model for placed items"""
    id: str
    stackability: Optional[str] = None
    position: Dict[str, float]
    rotation: List[float]
    dimensions: Dict[str, float]
    weight: float

class UnplacedItemResponse(BaseModel):
    """Response model for unplaced items"""
    id: str
    volume: float
    weight: float
    stackability: Optional[str] = None

class OptimizationResponse(BaseModel):
    """Main response model for packing optimization"""
    success: bool
    efficiency: float
    total_weight: float
    truck_dimensions: List[float]
    placed_items: List[PlacedItemResponse]
    unplaced_items: List[UnplacedItemResponse]
    statistics: Dict[str, int]
    execution_time: float
    timestamp: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str
    algorithm_available: bool

# Global variables for tracking
optimization_count = 0
total_execution_time = 0.0

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Bin Packer Cloud API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        version="1.0.0",
        algorithm_available=True
    )

@app.post("/api/v1/optimize", response_model=OptimizationResponse)
async def optimize_packing(request: OptimizationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Main optimization endpoint for 3D bin packing
    
    This endpoint takes truck dimensions and items, then uses the BinPackerV3
    algorithm to optimize the packing arrangement.
    """
    global optimization_count, total_execution_time
    
    start_time = datetime.now()
    
    try:
        logger.info(f"Starting optimization request #{optimization_count + 1}")
        logger.info(f"Truck: {request.truck.length}m x {request.truck.width}m x {request.truck.height}m")
        logger.info(f"Items: {len(request.items)}")
        
        # Resolve items: either from job_id or request.items
        algorithm_items = []
        if request.job_id is not None:
            job = db.query(PackingJob).filter(PackingJob.id == request.job_id).first()
            if not job:
                raise HTTPException(status_code=404, detail="Packing job not found")
            # Build items from PackingJobItem rows
            for pji in job.items:
                for _ in range(max(1, pji.quantity)):
                    algorithm_items.append(
                        Item(
                            id=str(pji.item_id) if pji.item_id else f"job{job.id}_item{pji.id}",
                            length=pji.item.length_mm / 1000.0,
                            width=pji.item.width_mm / 1000.0,
                            height=pji.item.height_mm / 1000.0,
                            weight=pji.item.weight_kg,
                            can_rotate=True,
                            destination=pji.destination or "",
                            is_palletized=True,
                            stackability=Stackability(pji.stackability)
                        )
                    )
            truck_dims = request.truck
            if not truck_dims:
                # Default vehicle dims from helper (meters)
                # Try find a vehicle; if none, create one
                veh = db.query(Vehicle).first()
                if not veh:
                    veh = create_default_vehicle()
                    db.add(veh)
                    db.flush()
                tl, tw, th = veh.get_dimensions_meters()
                truck_dims = TruckRequest(length=tl, width=tw, height=th)
        else:
            if not request.items or not request.truck:
                raise HTTPException(status_code=400, detail="Provide either job_id or truck+items")
            for item_req in request.items:
                algorithm_items.append(
                    Item(
                        id=item_req.id,
                        length=item_req.length,
                        width=item_req.width,
                        height=item_req.height,
                        weight=item_req.weight,
                        can_rotate=item_req.can_rotate,
                        destination=item_req.destination,
                        is_palletized=item_req.is_palletized,
                        stackability=Stackability(item_req.stackability) if item_req.stackability else Stackability.STACKABLE,
                    )
                )
            truck_dims = request.truck
        
        # Initialize the bin packer
        packer = BinPackerV3(
            truck_length=truck_dims.length,
            truck_width=truck_dims.width,
            truck_height=truck_dims.height,
        )
        
        # Run the optimization algorithm
        result = packer.pack_items(algorithm_items)
        
        # Calculate execution time
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # Update global statistics
        optimization_count += 1
        total_execution_time += execution_time
        
        # Log results
        logger.info(f"Optimization completed in {execution_time:.3f}s")
        logger.info(f"Efficiency: {result['efficiency']}%")
        logger.info(f"Items placed: {result['statistics']['items_placed']}")
        
        # Persist results if job-based
        if request.job_id is not None:
            try:
                job.status = "completed"
                job.efficiency_percentage = result['efficiency']
                job.total_weight_kg = result['total_weight']
                job.items_placed_count = result['statistics']['items_placed']
                job.items_unplaced_count = result['statistics']['items_unplaced']
                job.execution_time_ms = int(execution_time * 1000)
                job.result_data = result
                job.completed_at = datetime.now()
                db.add(job)
                db.commit()
            except Exception:
                db.rollback()

        # Convert result to response format
        response = OptimizationResponse(
            success=result['success'],
            efficiency=result['efficiency'],
            total_weight=result['total_weight'],
            truck_dimensions=list(result['truck_dimensions']),
            placed_items=[
                PlacedItemResponse(
                    id=item['id'],
                    stackability=item.get('stackability'),
                    position=item['position'],
                    rotation=list(item['rotation']),
                    dimensions=item['dimensions'],
                    weight=item['weight']
                )
                for item in result['placed_items']
            ],
            unplaced_items=[
                UnplacedItemResponse(
                    id=item['id'],
                    volume=item['volume'],
                    weight=item['weight'],
                    stackability=item.get('stackability')
                )
                for item in result['unplaced_items']
            ],
            statistics=result['statistics'],
            execution_time=execution_time,
            timestamp=datetime.now().isoformat()
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Optimization failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Optimization failed: {str(e)}"
        )


@app.post("/api/v1/import_excel")
async def import_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import items from an Excel file into a new packing job.
    Expected columns: id (opt), name (opt), length, width, height, weight, destination (opt), quantity (opt), stackability (opt)
    Units: meters for dimensions, kg for weight
    """
    try:
        # Read file into pandas
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Ensure vehicle exists
        veh = db.query(Vehicle).first()
        if not veh:
            veh = create_default_vehicle()
            db.add(veh)
            db.flush()

        job = PackingJob(name=f"Upload {file.filename}", vehicle_id=veh.id, status="pending")
        db.add(job)
        db.flush()

        inserted = 0
        for _, row in df.iterrows():
            length = float(row.get('length', 0))
            width = float(row.get('width', 0))
            height = float(row.get('height', 0))
            weight = float(row.get('weight', 0))
            if min(length, width, height, weight) <= 0:
                continue
            # Convert meters→mm for storage
            length_mm = int(round(length * 1000))
            width_mm = int(round(width * 1000))
            height_mm = int(round(height * 1000))
            stackability = str(row.get('stackability', 'stackable')).strip().lower()
            if stackability not in ("stackable", "semi_stackable", "unstackable"):
                stackability = "stackable"
            quantity = int(row.get('quantity', 1))
            destination = str(row.get('destination', '')).strip() or None

            # Create or reuse a simple Item row (optional: de-dup)
            item_row = ORMItem(
                name=str(row.get('name', row.get('id', 'item'))),
                length_mm=length_mm,
                width_mm=width_mm,
                height_mm=height_mm,
                weight_kg=weight,
                can_rotate=True,
                is_palletized=True,
                destination=destination,
                description=None,
                is_active=True,
            )
            db.add(item_row)
            db.flush()

            pji = PackingJobItem(
                packing_job_id=job.id,
                item_id=item_row.id,
                quantity=max(1, quantity),
                stackability=stackability,
                destination=destination,
            )
            db.add(pji)
            inserted += 1

        db.commit()
        return {"job_id": job.id, "items_count": inserted}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Failed to import Excel: {e}")

@app.get("/api/v1/statistics")
async def get_statistics():
    """Get API usage statistics"""
    avg_execution_time = total_execution_time / optimization_count if optimization_count > 0 else 0
    
    return {
        "total_optimizations": optimization_count,
        "total_execution_time": round(total_execution_time, 3),
        "average_execution_time": round(avg_execution_time, 3),
        "last_updated": datetime.now().isoformat()
    }

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info("🚀 Bin Packer Cloud API starting up...")
    logger.info("✅ Algorithm module loaded successfully")
    logger.info("✅ API endpoints registered")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("🛑 Bin Packer Cloud API shutting down...")
    logger.info(f"📊 Total optimizations processed: {optimization_count}")

if __name__ == "__main__":
    # Run the application
    logger.info("Starting Bin Packer Cloud API server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True  # Enable auto-reload for development
    ) 