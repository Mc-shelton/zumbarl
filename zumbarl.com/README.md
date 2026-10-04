# Zumbarl web application

React/Vite client for Zumbarl's student, business, Earn, Learn, Connect,
marketplace, project, finance, and wellbeing workflows. Runtime records come
from the API; seed fixtures are development/test-only.

## Local setup

Requirements: Node.js 20+, the backend dependencies from
`../zumbarl_backend/docker-compose.yml`, and a running backend on port 4100.

```bash
cp .env.example .env.local
npm ci
npm run dev -- --host 0.0.0.0 --port 5174
```

Vite serves HTTPS locally and proxies `/api` and `/files` to the backend. The
default same-origin API setting avoids mixed-content and CORS issues.

## Environment

- `VITE_ZUMBARL_API_URL`: API prefix or absolute API URL. Prefer `/api/v1`
  behind a production reverse proxy.
- `VITE_ZUMBARL_API_TIMEOUT_MS`: ordinary API timeout; defaults to 30 seconds.

Do not put secrets in `VITE_*` variables: Vite embeds them in browser assets.

## Verification

```bash
npm run lint
npm run build
npm run e2e
```

The browser suite expects the frontend at `https://127.0.0.1:5174` and the API
at `http://127.0.0.1:4100`. `npm run e2e:demo` explicitly refreshes the opt-in
development fixtures before running the core journey.

## Production

Build with `npm ci && npm run build`, serve `dist/` behind HTTPS, route `/api`
and `/files` to the backend, and use SPA fallback to `index.html`. Run the
backend's `release:prepare` and `go-live:verify` commands in the deployment
environment before sending traffic.
