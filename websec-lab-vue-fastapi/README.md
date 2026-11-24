# WebSec Lab — Vue + FastAPI + SQLite

Independent SPA implementation using Vue 3 and FastAPI. Includes CRUD, saved cases, request builder, response viewer, security-header checks, and history.

## Requirements

Python 3.10+ and Node.js 20+.

Open three PowerShell terminals:

**Terminal 1 (API):**
```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (practice target):**
```powershell
cd backend
python practice_server.py
```

**Terminal 3 (Vue):**
```powershell
cd frontend
npm install
npm run dev
```

Each terminal starts at this project root. Open http://127.0.0.1:5174. FastAPI interactive docs are at http://127.0.0.1:8000/docs.

## Demo

1. Create a test case, edit it, and save changes.
2. Send `GET /` then `GET /secure`; inspect response body, headers, and security checks.
3. Open Saved Test Cases and Run History, then delete a test case.
4. Restart and verify SQLite persistence.

## Safety

The API tests only a fixed loopback practice server at 127.0.0.1:3002. GET/POST and allowlisted headers only; redirects disabled. Do not expose demo servers publicly.

## Structure

`backend/main.py` FastAPI; `backend/core.py` SQLite and local tester; `backend/practice_server.py` practice target; `frontend/src/App.vue` Vue interface.
