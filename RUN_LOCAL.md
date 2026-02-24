# Run BinPacker Locally (Frontend + Backend)

This guide is for running the project **locally on Windows** with the current repo setup.

---

## Prerequisites

- **Node.js 16+** (for the React frontend)
- **Python 3.11.x** (recommended; required for the backend dependencies)
- (Optional) Git

---

## 1) Start the Backend (FastAPI) locally

### Option A (recommended): use the helper script

From the repo root:

```powershell
cd "C:\Users\Sirius\Desktop\Bin Packer\BinPacker_Cloud_App-master"
.\start_backend_local.ps1
```

This will:
- create/use `.\.venv`
- install `requirements.txt`
- start FastAPI with uvicorn at **`http://localhost:8000`**

### Option B (manual commands)

From the repo root:

```powershell
cd "C:\Users\Sirius\Desktop\Bin Packer\BinPacker_Cloud_App-master"

py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt

python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Backend URLs

- **Health**: `http://localhost:8000/api/v1/health`
- **Docs**: `http://localhost:8000/api/docs`
- **Optimize**: `POST http://localhost:8000/api/v1/optimize`

---

## 2) Start the Frontend (React) locally

Open a second PowerShell (leave the backend running) and run:

```powershell
cd "C:\Users\Sirius\Desktop\Bin Packer\BinPacker_Cloud_App-master\frontend"
npm install
npm start
```

The frontend will start at:
- `http://localhost:3000`

### API connection

By default, the frontend calls:
- `REACT_APP_API_BASE_URL || http://localhost:8000`

So as long as the backend is running on **port 8000**, optimization requests will work.

---

## Common Issues

### “NetworkError when attempting to fetch resource” when clicking Optimize

This almost always means the backend is not reachable.

Confirm backend is up:
- Open `http://localhost:8000/api/v1/health`

If it fails:
- restart backend using `.\start_backend_local.ps1`

### Python dependency install fails

Use **Python 3.11** (not 3.14). Verify:

```powershell
py -3.11 --version
```

---

## Stop services

- **Frontend**: press `Ctrl + C` in the frontend terminal
- **Backend**: press `Ctrl + C` in the backend terminal




