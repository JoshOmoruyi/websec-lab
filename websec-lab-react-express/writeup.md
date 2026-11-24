# WebSec Lab — Project Write-up

## Project overview

WebSec Lab is a local-only HTTP testing workbench built with React, Express, and SQLite. It allows users to create, view, edit, and delete saved HTTP test cases, send GET and POST requests to a bundled practice server, inspect responses, and review the presence of common defensive HTTP headers.

## Architecture

- **React/Vite frontend:** Interactive request editor, saved-case library, response viewer, security audit, and execution history.
- **Express backend:** REST endpoints, validation, SQLite CRUD operations, and a restricted request runner.
- **SQLite:** Stores test case configurations and recent execution metadata.
- **Local practice server:** Provides intentionally contrasting routes (`/` and `/secure`) for safe demonstrations.

## CRUD mapping

- Create: `POST /api/test-cases`
- Read: `GET /api/test-cases`
- Update: `PUT /api/test-cases/:id`
- Delete: `DELETE /api/test-cases/:id`

## Security measures

The application uses SQL prepared statements instead of concatenating input into queries. The backend validates required fields and method/path formats. The request runner fixes the target to a loopback-only practice service, disallows redirects, restricts custom headers, enforces timeouts, and caps response sizes. These controls are designed to avoid turning a classroom request builder into an unrestricted scanning or SSRF tool.

## User interface design

The interface uses a dark dashboard layout with a navigation sidebar, request editor, response inspector, header audit, and status cards. The visual hierarchy separates configuration, inspection, and analysis. The layout adapts to narrower screens.

## Manual tests to demonstrate

1. Create a test case and confirm it appears in the library.
2. Edit its name and path, then confirm the updated values persist after refresh.
3. Delete it and confirm it disappears from the library.
4. Send GET `/` and inspect response status, body, and missing security headers.
5. Send GET `/secure` and inspect the increased header presence score.
6. Send POST `/echo` with a JSON body and inspect the echoed data.
7. Attempt an invalid path or method and confirm the backend rejects it.
8. Stop the practice server and confirm the request runner returns a controlled error.

## Limitations and future work

This is an educational local testing application, not a production vulnerability scanner. Header presence alone does not establish correct security policy. Future work could include policy-value checks, richer assertions, test-case import/export, authentication for multi-user deployments, and controlled target management.

## Student reflection (personalize before submitting)

Describe what you learned about Express routes, request bodies, URL parameters, prepared statements, React state, and the distinction between successful HTTP requests and secure configurations. Add screenshots and the actual results of your own testing.
