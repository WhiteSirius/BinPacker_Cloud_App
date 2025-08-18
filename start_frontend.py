#!/usr/bin/env python3
"""
Startup script for the React Frontend
"""

import subprocess
import sys
import os

def main():
    """Start the React development server"""
    print("🚀 Starting Bin Packer Frontend...")
    print("📍 Frontend will be available at: http://localhost:3000")
    print("🔗 Backend API: http://localhost:8000")
    print("\n" + "="*60)
    
    try:
        # Navigate to frontend directory
        frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
        os.chdir(frontend_dir)
        
        # Start React development server
        subprocess.run(['npm', 'start'], check=True)
    except KeyboardInterrupt:
        print("\n🛑 Frontend server stopped by user")
    except FileNotFoundError:
        print("❌ npm not found. Please install Node.js and npm first.")
        print("   Download from: https://nodejs.org/")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start frontend: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 