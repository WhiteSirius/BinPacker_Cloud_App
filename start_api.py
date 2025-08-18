#!/usr/bin/env python3
"""
Startup script for the Bin Packer Cloud API
"""

import sys
import os
import uvicorn

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def main():
    """Start the FastAPI server"""
    print("🚀 Starting Bin Packer Cloud API...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📚 API Documentation: http://localhost:8000/api/docs")
    print("🔍 Alternative Docs: http://localhost:8000/api/redoc")
    print("🏥 Health Check: http://localhost:8000/api/v1/health")
    print("\n" + "="*60)
    
    try:
        # Import and run the app
        from api.main import app
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            reload=True
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main() 