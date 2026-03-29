# FinioRevive - Reviving Finances with Intelligence

Full-stack role-based financial recovery management system for housing societies.

## Tech Stack

- Frontend: React + Tailwind CSS
- Backend: Node.js + Express
- Database: SQLite (`sqlite3`)
- Auth: JWT

## Project Structure

- `frontend/` - React app
- `backend/` - Express API + SQLite DB

## Run Backend

1. `cd backend`
2. `npm install`
3. Create first admin once:
	- `npm run create-admin -- --name "Super Admin" --email admin@finio.com --password "YourStrongPassword"`
4. `npm run dev`

Backend runs on `http://localhost:5000`.

## Run Frontend

1. `cd frontend`
2. `npm install`
3. `npm run dev`

Frontend runs on `http://localhost:5173`.

## Data Persistence

All application data is stored in `backend/finio.db` (SQLite) and remains available across server restarts.
No demo users or seed data are required.
