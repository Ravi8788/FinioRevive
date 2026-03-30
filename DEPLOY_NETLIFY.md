# Netlify Deployment Checklist (Frontend + Database)

This project is deployed in two parts:

- Frontend on Netlify
- Backend API + SQLite database on a Node host with persistent disk (Render, Railway, Fly.io, VPS)

Why: Netlify is great for static frontend hosting, but SQLite needs persistent storage that Netlify serverless functions do not provide.

## 1) Push this repository to Git

```bash
git add .
git commit -m "chore: add netlify deployment setup"
git push
```

## 2) Deploy backend first (with persistent disk)

Use any Node host that supports persistent storage.

Required backend environment variables:

- `PORT=5000`
- `JWT_SECRET=<strong-secret>`
- `FRONTEND_URL=https://<your-netlify-site>.netlify.app`
- `DB_PATH=/var/data/finio.db` (or host-specific persistent disk path)

Backend start command:

```bash
npm run dev
```

After deployment, note your backend API URL, for example:

`https://finio-backend.onrender.com/api`

## 3) Deploy frontend on Netlify

1. In Netlify, create site from your Git repository.
2. Build settings are auto-detected from `netlify.toml`:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variable in Netlify site settings:
   - `VITE_API_URL=https://<your-backend-host>/api`
4. Trigger deploy.

## 4) Verify production

Check:

- Frontend opens at your Netlify URL.
- Login works.
- API requests return 200/401 instead of CORS errors.
- Data writes persist after backend restart (proves DB path is persistent).

## 5) Common fixes

- CORS blocked:
  - Ensure backend `FRONTEND_URL` exactly matches your Netlify URL.
- Data not persisting:
  - Ensure backend `DB_PATH` points to persistent storage, not ephemeral temp storage.
- Frontend shows network errors:
  - Ensure Netlify `VITE_API_URL` includes `/api`.