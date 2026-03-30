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

## Production Deployment Notes

If frontend is on Netlify, deploy backend on a Node host with persistent disk.

Set environment variables:

- `PORT=5000`
- `JWT_SECRET=<strong_secret>`
- `FRONTEND_URL=https://<your-netlify-site>.netlify.app`
- `DB_PATH=<persistent_disk_path>/finio.db`

If your host does not provide shell access (for example, some free tiers), you can bootstrap a super admin at startup:

- `BOOTSTRAP_ADMIN_NAME=<admin_name>`
- `BOOTSTRAP_ADMIN_EMAIL=<admin_email>`
- `BOOTSTRAP_ADMIN_PASSWORD=<admin_password>`

The bootstrap admin is created only when that email does not already exist.

Reason: SQLite requires persistent storage, which should be provided by backend hosting.
