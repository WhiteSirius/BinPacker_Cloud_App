#!/usr/bin/env python3
"""
Test runner script for Bin Packer Cloud App

This script runs all tests and provides a summary of results.
"""

import subprocess
import sys
import os
from datetime import datetime

def run_tests():
    """Run all tests and display results"""
    print("🧪 Starting Bin Packer Cloud App Tests...")
    print(f"⏰ Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        # Run pytest with verbose output
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "tests/", 
            "-v", 
            "--tb=short",
            "--color=yes"
        ], capture_output=True, text=True)
        
        # Print test output
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print("Warnings/Errors:")
            print(result.stderr)
        
        # Print summary
        print("=" * 60)
        if result.returncode == 0:
            print("🎉 All tests passed successfully!")
        else:
            print(f"❌ Some tests failed (exit code: {result.returncode})")
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Failed to run tests: {str(e)}")
        return False

def run_specific_test(test_file):
    """Run a specific test file"""
    print(f"🧪 Running specific test: {test_file}")
    print("=" * 60)
    
    try:
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            test_file,
            "-v", 
            "--tb=short",
            "--color=yes"
        ], capture_output=True, text=True)
        
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print("Warnings/Errors:")
            print(result.stderr)
        
        print("=" * 60)
        if result.returncode == 0:
            print("🎉 Test passed successfully!")
        else:
            print(f"❌ Test failed (exit code: {result.returncode})")
        
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Failed to run test: {str(e)}")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Run specific test file
        test_file = sys.argv[1]
        if not os.path.exists(test_file):
            print(f"❌ Test file not found: {test_file}")
            sys.exit(1)
        success = run_specific_test(test_file)
    else:
        # Run all tests
        success = run_tests()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main() 