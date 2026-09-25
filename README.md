# OTP checkout (React + Node/Express + Postgres)

React (Vite, TS) → Express API → Postgres. Three separate layers, three deploy targets.

## Flows
- **Register**: email + first/last name → server generates a 6-digit code with `crypto.randomInt`, stores only a bcrypt hash, returns the plaintext once.
- **Checkout**: once the email is well-formed (debounced 350 ms) the UI calls `GET /api/recognize`. If registered, a modal asks for the code (skippable). `POST /api/login` returns a session token; the form then shows the user's name. `POST /api/checkout` inserts into `checkout_submissions`, linked to the user when a valid token is sent.

## Schema
`db/001_schema.sql` (users, sessions, checkout_submissions). Run it once against your database.

## Security notes
- Code hashed at rest; 5 wrong attempts lock login for 15 min; per-IP rate limits on `/recognize` and `/login`.
- Session tokens are random, stored hashed, expire in 24 h, and are kept in browser memory only.
- All SQL is parameterized. `/api/recognize` reveals whether an email is registered — inherent to the requirement.

## Run locally
```bash
createdb otp && psql otp -f db/001_schema.sql
cd server && cp .env.example .env && npm install
set -a; . ./.env; set +a; npm run dev
cd web && npm install && npm run dev       # proxies /api to :8080
```

## Deploy (free tiers)
1. **Database – Supabase**: new project → SQL editor → paste `db/001_schema.sql` → run. Copy the connection string (Project Settings → Database; the pooler URL is safest on Render).
2. **API – Render**: Web Service from this repo, root dir `server`, build `npm install`, start `npm start`, health check `/healthz`. Env: `DATABASE_URL` (Supabase string), `PGSSL=true`, `CORS_ORIGIN` (your Vercel URL, set after step 3).
3. **Web – Vercel**: root dir `web`, framework Vite, env `VITE_API_URL=https://<render-service>.onrender.com`. Then set `CORS_ORIGIN` on Render to the Vercel URL and redeploy.
4. GitHub → Settings → Collaborators → add `boltapp-hiring`.

Render's free tier sleeps when idle; open the site once before sharing.
