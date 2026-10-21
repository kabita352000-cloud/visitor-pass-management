# Visitor Pass Management System (MERN)

A full-stack MVP for digitally registering visitors, managing appointments, issuing QR passes, and recording secure check-in/check-out events.

## Features
- JWT authentication and role-based access (`admin`, `security`, `employee`, `visitor`)
- Visitor self-registration and appointment requests
- Admin-only staff and account management
- Visitor registration with name, contact, company, purpose, host, and optional photo URL
- Appointment requests and approval
- QR pass generation and downloadable PDF badge
- QR scanner page (camera support where browser permissions/HTTPS allow) plus manual pass-code lookup
- Check-in/check-out logs with duplicate-state protection
- Dashboard statistics, visitor search/filter, CSV export
- Seed script with demo accounts and records
- Audit-friendly check logs

## Tech stack
- Backend: Node.js, Express, MongoDB/Mongoose, JWT, bcrypt, QRCode, PDFKit, Nodemailer
- Frontend: React, Vite, React Router, Axios, html5-qrcode
- SMS: optional Twilio integration configured with environment variables

## Requirements
- Node.js 18+
- MongoDB local or MongoDB Atlas
- npm

## Setup

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit MONGO_URI and JWT_SECRET. Email is optional for local demo.
npm install
npm run seed
npm run dev
```
Backend runs at `http://localhost:5000`.

Set `VITE_API_URL` in `frontend/.env` if the backend API is not at `http://localhost:5000/api`.
For local development, the frontend can be opened at `localhost` or `127.0.0.1` on any port (Vite may choose `5174` if `5173` is busy). If accessing it from another device, set `VITE_API_URL` to the backend's reachable address and add the frontend's full origin to `CLIENT_URL` in `backend/.env`.

### 2. Frontend
Open another terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Open the app

With the backend and frontend running, open these links in your browser. The frontend uses `localhost` by default; if Vite reports a different port (for example, `5174`), replace `5173` in the URLs with the port shown in the terminal.

| Page | URL | Who can use it |
|---|---|---|
| Sign in | [http://localhost:5173/login](http://localhost:5173/login) | All roles |
| Admin dashboard | [http://localhost:5173/](http://localhost:5173/) | Admin, Security |
| Admin user management | [http://localhost:5173/users](http://localhost:5173/users) | Admin |
| Visitor directory | [http://localhost:5173/visitors](http://localhost:5173/visitors) | Admin, Security, Employee |
| Appointments and approvals | [http://localhost:5173/appointments](http://localhost:5173/appointments) | Admin, Security, Employee |
| Issue/review passes | [http://localhost:5173/passes](http://localhost:5173/passes) | Admin, Security |
| Scan and verify passes | [http://localhost:5173/scan](http://localhost:5173/scan) | Admin, Security |
| Check-in/check-out logs | [http://localhost:5173/logs](http://localhost:5173/logs) | Admin, Security |
| Visitor portal | [http://localhost:5173/my-visit](http://localhost:5173/my-visit) | Signed-in Visitor |
| Visitor registration | [http://localhost:5173/register](http://localhost:5173/register) | New visitors |
| Backend health check | [http://localhost:5000/api/health](http://localhost:5000/api/health) | API status |

### Sign in as Admin

1. Start MongoDB, then start the backend and frontend using the setup steps above.
2. If you have not seeded the database yet, run `cd backend && npm run seed`.
3. Open [http://localhost:5173/login](http://localhost:5173/login) and sign in with **admin@example.com** / **Pass1234!**.
4. The admin dashboard opens at [http://localhost:5173/](http://localhost:5173/). Use **Manage users** in the sidebar or open [http://localhost:5173/users](http://localhost:5173/users) directly.

### Sign in as Visitor

Open [http://localhost:5173/login](http://localhost:5173/login) and sign in with **visitor@example.com** / **Pass1234!** after seeding. Visitors are redirected to [http://localhost:5173/my-visit](http://localhost:5173/my-visit), where they can submit an appointment request and see their appointments and passes. A new visitor can instead use [http://localhost:5173/register](http://localhost:5173/register).

## Demo accounts
All demo passwords are `Pass1234!`

<!-- Email: gatepass.admin@example.com
Password: Pass1234! -->

| Role | Email |
|---|---|
| Admin | admin@example.com |
| Security / Frontdesk | security@example.com |
| Employee / Host | employee@example.com |
| Visitor | visitor@example.com |

For a local demo, sign in using the Admin or Security account to access the full operations UI. The visitor demo account has an approved appointment and an active pass, so you can also preview the visitor portal.
Visitors can create an account from the sign-in page; the frontend signs them in and opens the appointment request form.

## First admin setup
The seed script creates a demo admin (`admin@example.com` / `Pass1234!`). For a fresh database without an admin, set a private `ADMIN_SETUP_KEY` in `backend/.env` (at least 32 characters), restart the backend, and make one request to `POST /api/auth/register-admin`. This endpoint accepts `setupKey`, `name`, `email`, `password`, and optional `phone`; it creates and signs in the first admin. Registration closes once an admin exists. Do not put the setup key in frontend code or share it.

To generate a setup key locally, run `openssl rand -hex 32` and put the output in `backend/.env` as `ADMIN_SETUP_KEY=<generated-value>`. The Postman collection has an `adminSetupKey` variable for this endpoint. If you already ran the seed script, use the demo admin or sign in with an existing admin account instead.

## API overview
- `POST /api/auth/register` — register account (public registration defaults to visitor)
- `POST /api/auth/login`
- `POST /api/auth/register-admin` — securely bootstrap the first admin (one time; requires `ADMIN_SETUP_KEY`)
- `POST /api/auth/admin/login` — sign in only if the credentials belong to an admin
- `GET /api/auth/me`
- `GET /api/users` / `POST /api/users` — list or create accounts (admin only)
- `GET /api/visitors` — list/search visitors (staff roles)
- `POST /api/visitors` — register visitor (staff roles)
- `GET /api/appointments`
- `GET /api/appointments/mine` — visitor's own requests and approval status
- `POST /api/appointments`
- `PATCH /api/appointments/:id/approve` — admin/employee
- `POST /api/passes/issue` — security/admin
- `GET /api/passes` / `PATCH /api/passes/:id/revoke` — manage passes
- `GET /api/passes/mine` — visitor's own digital passes and QR codes
- `GET /api/passes/:code/pdf` — download badge PDF
- `POST /api/checklogs/check-in` — security/admin
- `POST /api/checklogs/check-out` — security/admin
- `GET /api/checklogs` — staff log list
- `GET /api/dashboard/stats` — admin/security dashboard statistics
- `GET /api/reports/export.csv` — staff CSV export

Visitor search and list endpoints accept a `limit` query parameter. Appointment and pass lists can be filtered by `status`; check logs and CSV exports accept `action`, `from`, and `to` filters.

Visitor accounts can view only their own appointments and passes from the visitor portal. Pass PDF downloads are restricted to staff and the visitor who owns that pass.

## Testing the API with Postman
Import [`backend/postman/Visitor Pass Management.postman_collection.json`](./backend/postman/Visitor%20Pass%20Management.postman_collection.json) in Postman. Set the collection variables:

| Variable | Value |
|---|---|
| `baseUrl` | `http://localhost:5000` |
| `token` | JWT returned by `/api/auth/login` |
| `visitorId` | Visitor `_id` returned by `/api/visitors` |
| `appointmentId` | Appointment `_id` returned by `/api/appointments` |
| `passId` | Pass `_id` returned by `/api/passes` |
| `passCode` | Pass `code` returned by `/api/passes/issue` |

For first-admin setup, copy `ADMIN_SETUP_KEY` from `backend/.env` into the Postman `adminSetupKey` variable and call `Register first admin` once. Afterward, use `Admin login` and copy its `token` into the collection `token` variable. If you seeded the database, a demo admin already exists, so skip first-admin setup and log in with that account. Protected requests use the token as a Bearer token. Requests that create records return IDs to copy into the corresponding variables. The collection includes every API endpoint, including PDF download and CSV export.

## Backend layout
Backend code follows a route → controller → service → model flow:

```text
backend/
  app.js
  server.js
  src/
    controllers/
    middleware/
    models/
    routes/
      index.routes.js
    services/
    utils/
  seed.js
```

`src/routes/index.routes.js` mounts the endpoint groups. Routes handle URL and role wiring, controllers translate HTTP requests and responses, and services contain business rules and database operations.

API startup requires a unique `JWT_SECRET` of at least 32 characters and a reachable MongoDB instance.

MongoDB stores authentication identities in `Users` and visitor profiles in `Visitors` (with an optional link to a visitor login account). `Appointments` track scheduling and approval, `Passes` reference visitor profiles, and `CheckLogs` reference both the pass and visitor profile.

Visitor login accounts are stored in `Users` with the `visitor` role. Their visitor profile is stored separately in `Visitors`; approved appointments link both records, while passes and check logs reference the visitor profile. This keeps login identity separate from visit details and access history.

## Frontend layout
```text
frontend/src/
  components/  Shared layout, page titles, notices, and route guards
  context/     Sign-in state shared by the application
  pages/       One file for each user-facing screen
  utils/       Small helpers for dates, errors, and downloads
  api.js       Axios client with the saved JWT
  App.jsx      Routes and page access rules
```

## Email / SMS
Email notifications are sent when the SMTP values in `backend/.env` are configured; without SMTP, the API logs that the notification was skipped. SMS notifications use Twilio when all three `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` values are configured. Visitor phone numbers must be in E.164 format for Twilio delivery. If none are configured, SMS is skipped and logged; a partial Twilio configuration is reported as an error. Keep provider credentials private and never put them in frontend variables or commit them.

## QR scanning
Use the Scan page and allow camera permission. Camera access normally requires localhost or HTTPS. If camera access is unavailable, enter the pass code manually; both options use the same check-in/out API.

## Notes before production
This is an assignment-ready MVP, not a security-audited production system. Before production: use a managed secret store, HTTPS, rate limiting, image upload storage (S3/Cloudinary), retention policies, tenant isolation for multi-organization support, and automated tests. Public account registration cannot self-assign privileged roles; staff accounts are managed through the admin-only users endpoint.
