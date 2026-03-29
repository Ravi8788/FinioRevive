# FinioRevive Backend

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies:
   - `npm install`
3. Create first admin user:
   - `npm run create-admin -- --name "Super Admin" --email admin@finio.com --password "YourStrongPassword"`
4. Start server:
   - `npm run dev`

## Auth Endpoints

- `POST /api/auth/login`

Self-registration is disabled.
Only `super_admin` can create user credentials through `POST /api/users`.

## Additional Endpoints

- `PUT /api/users/:id` (super_admin)
- `GET /api/reports/payments.csv`
- `GET /api/reports/recoveries.csv`
- `GET /api/reports/recoveries.pdf`

## Pagination

Paginated endpoints:

- `GET /api/members?page=1&limit=20`
- `GET /api/payments?page=1&limit=20`

Response metadata is returned in headers:

- `X-Total-Count`
- `X-Page`
- `X-Limit`

## Data Storage

All records are stored in `backend/finio.db` and persist across restarts.
