# Vyaya — Diagnostic Audit Report

## 1. Problems detected and fixed

| # | Issue | Fix | Why it matters |
|---|--------|-----|----------------|
| 1 | **Boot order** — Server could `listen` before MongoDB was ready; `connectDB()` was not awaited | `server.js`: Load dotenv → validate env → require app → `await connectDB()` → `listen` in async `start()` | Prevents routes from running before DB is connected; avoids silent failures. |
| 2 | **No fail-fast for missing env** — Missing `JWT_SECRET` or `MONGODB_URI` caused Passport or DB to crash with unclear errors | `server.js`: `validateEnv()` throws with clear messages if `JWT_SECRET`, `MONGODB_URI` missing; in production requires `CLIENT_URL` and no trailing slash | Configuration errors surface immediately with actionable messages. |
| 3 | **Passport JWT** — Strategy could run with undefined `secretOrKey` if .env loaded late | `config/passport.js`: Guard `if (!process.env.JWT_SECRET) throw new Error(...)`; always set `secretOrKey: process.env.JWT_SECRET` | Prevents "JwtStrategy requires a secret or key" and enforces env before app load. |
| 4 | **MongoDB** — On failure, `process.exit(1)` inside `db.js` prevented `server.js` from handling error | `config/db.js`: `throw error` instead of `process.exit(1)`; log "MongoDB connected" / "MongoDB connection failed" | Single place (server.js) handles startup failure; clearer logs. |
| 5 | **CORS** — Undefined `CLIENT_URL` could lead to permissive origin | `app.js`: `origin: process.env.CLIENT_URL \|\| false` | No wildcard; CORS disabled when `CLIENT_URL` is not set. |
| 6 | **Cookies in dev** — `secure: true` and `sameSite: 'None'` block cookies on `http://localhost` | `generateToken.js` and `authController.js` (logout): `secure` and `sameSite` depend on `NODE_ENV` — production: `secure: true`, `sameSite: 'None'`; dev: `secure: false`, `sameSite: 'Lax'` | Login and cookies work on localhost; production stays HTTPS-only and cross-site safe. |
| 7 | **Frontend API URL** — Trailing slash in `VITE_API_URL` could produce double slash | `client/src/utils/api.js`: Strip trailing slash from base; `API_URL = base ? \`${base}/api\` : '/api'` | Prevents malformed URLs on Vercel when env has a trailing slash. |
| 8 | **.env path** — Already correct | `server.js`: `path.join(__dirname, '.env')` | Loads `.env` from server folder regardless of cwd. |

---

## 2. What was not changed (already correct)

- **dotenv**: Present in `package.json`; loaded first in `server.js` with correct path.
- **Auth flow**: JWT only in HTTP-only cookie; not in JSON; `protect` reads `req.cookies.token`; logout clears cookie.
- **Axios**: `withCredentials: true`; no token in headers or localStorage.
- **Trust proxy**: `app.set('trust proxy', 1)` set in `server.js` before listen.
- **AuthContext**: Calls `/auth/me` on load; no token in frontend state.

---

## 3. Corrected code (summary)

- **server/server.js** — Env validation, strict boot order, async `start()` with `await connectDB()`, `start().catch()` for exit.
- **server/config/db.js** — Return connection, throw on failure, clear logs.
- **server/config/passport.js** — JWT_SECRET guard, always set `secretOrKey`.
- **server/app.js** — CORS `origin: process.env.CLIENT_URL || false`.
- **server/utils/generateToken.js** — Cookie options by `NODE_ENV` (secure, sameSite).
- **server/controllers/authController.js** — Logout cookie options by `NODE_ENV`.
- **client/src/utils/api.js** — Base URL from `VITE_API_URL`, trailing slash stripped.
- **server/.env.example** — Added with required and optional vars and production notes.

---

## 4. Production checklist (Render + Vercel)

**Backend (Render)**  
- `NODE_ENV=production`  
- `MONGODB_URI` = Atlas URI  
- `JWT_SECRET` = long random string  
- `CLIENT_URL` = exact frontend origin, **no trailing slash** (e.g. `https://vyaya.vercel.app`)  
- `GOOGLE_CALLBACK_URL` = `https://<your-render-service>.onrender.com/api/auth/google/callback`  
- Trust proxy: already set in code  

**Frontend (Vercel)**  
- `VITE_API_URL` = backend origin, **no trailing slash** (e.g. `https://vyaya-api.onrender.com`)  

**Google Cloud Console**  
- Authorized redirect URI = `GOOGLE_CALLBACK_URL` above  

**No localhost in production** — All of the above must use HTTPS and real domains.

---

## 5. Suggested improvements (optional)

- **Health check** — Render can call `GET /api/health`; already implemented.
- **Rate limit** — Already different for prod (100) vs dev (2000); consider per-route limits for auth if needed.
- **Retry for MongoDB** — Mongoose can retry; your URI already has `retryWrites=true`; for full process retry, use a small retry loop in `connectDB` or a process manager.
- **Remove debug route** — Delete or restrict `GET /api/debug-cookie` in production (e.g. only when `NODE_ENV !== 'production'`).
