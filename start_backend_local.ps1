# Start BinPacker backend locally on Windows without affecting cloud deployment.
# Requires: Python 3.11+ installed (recommended 3.11), via the Python Launcher (py.exe).
#
# Usage (PowerShell):
#   .\start_backend_local.ps1
#
# What it does:
# - Creates/uses a local virtualenv at .\.venv
# - Installs requirements.txt into that venv
# - Starts FastAPI via uvicorn on http://localhost:8000 (with reload)

$ErrorActionPreference = "Stop"

Write-Host "== BinPacker Local Backend Starter ==" -ForegroundColor Cyan

# Ensure we're in repo root (this script lives at root).
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

function Require-Python311 {
  try {
    $null = & py -3.11 --version 2>$null
    return $true
  } catch {
    return $false
  }
}

if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Python Launcher (py.exe) not found." -ForegroundColor Red
  Write-Host "Install Python 3.11 and ensure the launcher is installed, then re-run." -ForegroundColor Yellow
  exit 1
}

if (-not (Require-Python311)) {
  Write-Host "ERROR: Python 3.11 not found via 'py -3.11'." -ForegroundColor Red
  Write-Host "Install Python 3.11 (x64), then open a NEW PowerShell and verify:" -ForegroundColor Yellow
  Write-Host "  py -3.11 --version" -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path ".\.venv")) {
  Write-Host "Creating virtual environment (.venv) with Python 3.11..." -ForegroundColor Cyan
  & py -3.11 -m venv .\.venv
}

Write-Host "Activating venv..." -ForegroundColor Cyan
. .\.venv\Scripts\Activate.ps1

Write-Host "Upgrading pip..." -ForegroundColor Cyan
python -m pip install --upgrade pip

Write-Host "Installing backend dependencies (requirements.txt)..." -ForegroundColor Cyan
pip install -r requirements.txt

Write-Host ""
Write-Host "Starting FastAPI backend on http://localhost:8000" -ForegroundColor Green
Write-Host "Health check: http://localhost:8000/api/v1/health" -ForegroundColor Green
Write-Host "Docs:        http://localhost:8000/api/docs" -ForegroundColor Green
Write-Host ""

# Use uvicorn module to ensure we're using the venv's uvicorn.
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload




