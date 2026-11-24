# WebSec Lab — Local HTTP Security Workbench

A full-stack school project using **React + Vite**, **Express**, and **SQLite (better-sqlite3)**. It provides saved HTTP test cases (CRUD), a request builder, a response viewer, security-header presence checks, and recent request history. A bundled practice target keeps demonstrations local.

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm
- VS Code or any terminal

## Start the project (three terminals)

Open the `websec-lab` folder in VS Code.

**Terminal 1 — backend API:**

```powershell
cd backend
npm install
npm start
```

Expected: `WebSec Lab API: http://127.0.0.1:3001`

**Terminal 2 — practice target:**

```powershell
cd backend
npm run target
```

Expected: `Practice target: http://127.0.0.1:3002`

**Terminal 3 — frontend:**

```powershell
cd frontend
npm install
npm run dev
```

Open **http://127.0.0.1:5173** in your browser. Vite proxies `/api` requests to the Express backend.

> In VS Code, if a new terminal opens at the root, run the `cd` command shown. If already inside `backend` or `frontend`, skip `cd`.

## Demo walkthrough

1. Open Request Builder. Choose `GET` and path `/` and click **Send Request**. You should receive HTTP 200 and a JSON welcome message.
2. Change the path to `/secure`, click **Send Request**, and compare the security-header results. The `/secure` endpoint sets several defensive headers.
3. Set the name to `Secure Endpoint`, choose `GET`, path `/secure`, and click **Save Case**.
4. Open **Saved Test Cases** and select **Open**. Change the name and click **Update Case**.
5. View **Run History** to inspect recent requests.
6. Delete the saved case using the trash icon in Request Builder. Confirm it disappears from Saved Test Cases.
7. Optional POST demo: method `POST`, path `/echo`, headers `{"Content-Type":"application/json"}`, body `{"message":"hello"}`. Click **Send Request**.

## Backend API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API status |
| GET | `/api/test-cases` | List saved test cases |
| POST | `/api/test-cases` | Create a test case |
| PUT | `/api/test-cases/:id` | Update a test case |
| DELETE | `/api/test-cases/:id` | Delete a test case |
| POST | `/api/run` | Execute a request against the fixed practice target |
| GET | `/api/history` | List the last 20 request runs |

Test case JSON:

```json
{
  "name": "Homepage Test",
  "method": "GET",
  "path": "/",
  "headers": "{}",
  "body": ""
}
```

## Database

The backend creates `backend/websec.db` automatically on first start. Tables: `test_cases` and `test_runs`. Do not delete your database if it contains work you want to keep.

**Important for an existing project:** This download includes a fresh `database.js` schema. If you are integrating with an older `websec.db`, `CREATE TABLE IF NOT EXISTS` does **not** migrate old columns. For the simplest setup, run this project in its own folder with its own new database. Do not overwrite your original `websec.db` without a backup.

## Safety scope

- The request runner always uses the fixed origin `http://127.0.0.1:3002`; the UI cannot choose a remote target.
- Only GET and POST are allowed by the runner; redirects are **not** followed.
- Only `Accept`, `Content-Type`, and `X-Demo-Label` custom request headers are allowed.
- Requests time out after five seconds; responses are capped at 64 KiB.
- The backend and target listen on loopback only.
- Header analysis reports presence, **not** proof of security. For example, `X-Frame-Options` is a legacy header and some browser defenses are context-dependent.

## Project structure

```
websec-lab/
  backend/
    database.js
    server.js
    practice-server.js
    package.json
  frontend/
    index.html
    vite.config.js
    package.json
    src/
      main.jsx
      App.jsx
      styles.css
  README.md
  writeup.md
```

## Troubleshooting

- **API OFFLINE:** Check that `node server.js` is running in the backend folder on port 3001.
- **Local target connection failed:** Run `npm run target` from `backend` in another terminal.
- **Port already in use:** Stop previous Node servers with Ctrl+C in their terminals.
- **`better-sqlite3` installation failure:** Use a supported Node.js LTS version and reinstall dependencies.
- **Existing database schema errors:** Keep the original database safe; use the new folder's fresh database or plan a schema migration.

## Future enhancements

Editable target allowlists with strong validation, improved header-value analysis, more HTTP methods, import/export test cases, automated test assertions, and richer history filtering.
