# WebSec Lab

A full-stack cybersecurity learning project for managing HTTP test cases, executing requests against a controlled local practice server, and analyzing HTTP security headers.

## Features

- Create, read, update, and delete HTTP test cases
- Store test cases persistently using SQLite
- Execute HTTP requests against local practice endpoints
- Inspect HTTP response status, headers, and body
- Audit common HTTP security headers
- Compare insecure and secure endpoint configurations
- View request history

## Technology Stacks

| Version | Frontend | Backend | Database |
|---|---|---|---|
| 1 | React | Express.js | SQLite |
| 2 | HTML / Jinja2 | Flask | SQLite |
| 3 | Vue.js | FastAPI | SQLite |

## Security Analysis

WebSec Lab evaluates common HTTP security headers, including Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, and Referrer-Policy.

The application uses a controlled local testing environment and is intended for educational purposes.

## Getting Started

Each implementation has its own README with installation and execution instructions.

## Project Goals

This project demonstrates full-stack application development, REST API design, CRUD operations, database persistence, HTTP request handling, and introductory web application security analysis.

## Future Improvements

- Automated regression tests
- Exportable security reports
- Additional HTTP security checks
- Improved request comparison and filtering
