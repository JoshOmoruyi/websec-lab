# WebSec Lab — Flask + Jinja2 + SQLite

Independent server-rendered implementation. Includes CRUD UI, saved test cases, local request execution, response viewer, security-header analysis, run history, and JSON REST endpoints.

## Windows PowerShell setup

Open two terminals in this folder:

**Terminal 1:**
```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

**Terminal 2:**
```powershell
python practice_server.py
```

Visit http://127.0.0.1:5000. If terminal 2 uses another Python installation, it only needs the standard library.

## Demo

1. Create a saved case (`GET /`), then edit and save it (`GET /secure`).
2. Run `/` and note missing headers; run `/secure` and note five present headers.
3. View recent runs, delete a case, and refresh to verify persistence.
4. Optionally inspect JSON endpoints: `/api/health`, `/api/test-cases`, `/api/history`.

## Safety

Requests are restricted to a fixed loopback practice target on port 3002. Only GET/POST and three allowlisted request headers are supported. Redirects are not followed. Do not expose these demo servers publicly.

## Structure

`app.py` Flask routes; `core.py` validation, SQLite, local HTTP tester; `practice_server.py` local target; `templates/` Jinja UI; `static/` CSS. SQLite database `websec.db` is created automatically.
