# FinioRevive - Reviving Finances with Intelligence

FinioRevive is a production-style, role-based financial recovery platform for housing societies.
It helps teams manage overdue payments end-to-end with structured workflows for telecalling, field recovery, legal escalation, reconciliation, and reporting.

## Highlights

- Role-based access control with JWT authentication
- Complete recovery lifecycle tracking (calls, notices, payments)
- Super Admin operations for users, societies, and members
- Dashboard analytics and reporting exports
- Legal notice PDF generation
- Full data persistence in SQLite (no demo seed dependency)

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite (`sqlite3`)
- Auth: JWT (`jsonwebtoken`) + `bcryptjs`
- PDF: `pdfkit`

## Repository Structure

- `frontend/`: React application UI
- `backend/`: Express API, SQLite database, middleware, routes, scripts

## Core Modules

### Super Admin
- Manage users (create, update, delete)
- Manage societies (create, update, delete)
- Manage members (create, update, delete)
- Global access to calls, notices, payments, dashboard, reports

### BDM
- Manage assigned societies and members
- Assign field teams
- View scoped notices

### Telecaller
- Log calls for assigned members
- Update outcomes and escalation signals

### Agent
- Work assigned members
- Record payments for assigned members

### Legal
- Generate legal notices (D1, D2, D3)
- Track notice history and PDF documents

### Accounts
- View and reconcile payments
- Track reconciliation status

## Backend APIs (High Level)

- Auth: `/api/auth/login`
- Users: `/api/users`
- Societies: `/api/societies`
- Members: `/api/members`, `/api/members/:id/details`
- Calls: `/api/calls`
- Notices: `/api/notices`, `/api/notices/generate`
- Payments: `/api/payments`, `/api/payments/:id/reconcile`
- Dashboard: `/api/dashboard`, `/api/dashboard/stats`
- Reports: `/api/reports/*`

## Local Development

### 1) Backend

1. `cd backend`
2. `npm install`
3. Create first admin user once:
	- `npm run create-admin -- --name "Super Admin" --email admin@finio.com --password "YourStrongPassword"`
4. Start backend:
	- `npm run dev`

Backend default URL: `http://localhost:5000`

### 2) Frontend

1. `cd frontend`
2. `npm install`
3. Start frontend:
	- `npm run dev`

Frontend runs on an available Vite port (typically `5173`, else next free port).

## Authentication Flow

1. Login from landing page modal or login screen
2. Backend returns JWT + user payload
3. Frontend stores token and user in `localStorage`
4. Protected routes are enforced by role permissions

## Data Persistence

- Main DB file: `backend/finio.db`
- Data persists across server restarts
- No hardcoded sample data is required for runtime

## Testing

- Backend integration tests are in `backend/tests`
- Tests run on isolated test DB files so production data is not touched

Run:

- `cd backend && npm test`

## Deployment

### Frontend on Netlify

Recommended settings:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Environment variable: `VITE_API_URL=<your_backend_url>/api`

### Backend Hosting

Backend is an Express API and should be hosted on a Node-compatible platform (for example Render, Railway, Fly.io, VPS, etc).
Point Netlify frontend `VITE_API_URL` to that hosted backend URL.

## Security Notes

- Keep `backend/.env` private and never commit secrets
- Use strong passwords for admin credentials
- Rotate JWT secret for production environments

## License

Private project.
