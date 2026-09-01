# Zumbarl Backend

Fastify + TypeScript API for the current Zumbarl frontend and process docs. The route surface is organized around the product workflows in `docs/zumbarl_processes.md`:

- Auth and RBAC for students, businesses, admins, moderators, and support.
- Business opportunity creation, publishing, funding, invites, applicant review, interviews, and award handoff.
- Earn bid submission, invite acceptance, project deliverables, review gates, revision caps, payouts, and trust snapshots.
- Project team applications, milestone funding, activation, locked scope, tasks, submissions, and disbursement readiness.
- Marketing campaign funding, 24-hour invite windows, campaign acceptance, proof submission, stats generation, and endorsements.
- Learn roadmap generation, lock-to-roadmap, evidence scoring, tests, verification, and business transition pools.
- Connect stories, posts, typed tags, reactions, comments, reports, groups, clubs, and chama contributions.
- Marketplace shop setup, listings, cart, checkout, fulfillment statuses, reviews, disputes, and score inputs.
- Finance wallets, ledgers, escrows, payouts, and release operations.
- Wellness/support cases, counselor bookings, uploads, moderation, and admin metrics.
- Evergreen recurring internships/attachments, consented matching, formal offers, exclusive placement locks, supervision, completion, billing entitlements, and recurrence.

## Run Locally

```bash
cd zumbarl_backend
cp .env.example .env
npm install
docker compose up -d
npx prisma db push
npm run dev
```

The API runs on `http://localhost:4100`. Swagger UI is available at `http://localhost:4100/docs`.

### Zumbarl Evergreen

Evergreen is exposed under `/api/v1/evergreen` and is guarded by the database-backed `evergreen.enabled` feature flag. Its API groups are:

- company eligibility, programs, cohorts, consented candidates and formal offers;
- student readiness, placement availability, explained matches, applications, offers and placement history;
- shared placement onboarding, goals, scheduled check-ins, evidence, evaluations and mutually accepted amendments;
- protected student support, operations review/resolution, failed-job/event visibility and idempotent replay;
- finance-issued invoices, verified settlement confirmation, dated entitlements, suspension and refunds.

Evergreen maintenance runs once at API startup and every 15 minutes. Each job uses a database lease and records its result in `evergreen_job_runs`. Operations can replay a named job with `POST /api/v1/evergreen/admin/jobs/:name/replay`; failed outbox events are visible at `GET /api/v1/evergreen/admin/failures` and can be requeued through `POST /api/v1/evergreen/admin/events/:id/replay`.

Use forward migrations for Evergreen rather than `db push`:

```bash
npx prisma migrate deploy
npx prisma migrate status
npx prisma db execute --file prisma/migrations/20260831190000_add_evergreen/verify.sql
```

The verification SQL is read-only and every query must return zero rows. Local defaults remain `http://localhost:4100` for the API, PostgreSQL on `localhost:55432`, and Redis on `localhost:56379`.

`EVERGREEN_QUALIFICATION_GIGS` controls the verified-gig qualification threshold and defaults to `3`; `EVERGREEN_REPEAT_HIRE_LIMIT` controls repeat placements with one company and also defaults to `3` unless an approved mentorship alternative exists.

### Local road-distance routing

Marketplace delivery quotes use the locally hosted OSRM service at `http://127.0.0.1:55000`. The service calculates driving distance over OpenStreetMap roads. Prepare the Kenya graph once (and repeat these commands whenever the map extract is refreshed):

```bash
mkdir -p osrm-data
curl -fL https://download.geofabrik.de/africa/kenya-latest.osm.pbf -o osrm-data/kenya-latest.osm.pbf
docker run --rm -t -v "$PWD/osrm-data:/data" ghcr.io/project-osrm/osrm-backend:v6.0.0 osrm-extract -p /opt/car.lua /data/kenya-latest.osm.pbf
docker run --rm -t -v "$PWD/osrm-data:/data" ghcr.io/project-osrm/osrm-backend:v6.0.0 osrm-partition /data/kenya-latest.osrm
docker run --rm -t -v "$PWD/osrm-data:/data" ghcr.io/project-osrm/osrm-backend:v6.0.0 osrm-customize /data/kenya-latest.osrm
docker compose up -d osrm
```

If OSRM is temporarily unavailable or cannot find a connected driving route, quotes use the configured adjusted-Haversine fallback and identify the distance source accordingly.

Local startup initializes an empty database. Accounts and product data are created through the application workflows.

To populate the local database with the optional development dataset, run it explicitly:

```bash
npm run db:seed
```

## Production Notes

Repositories use Prisma-backed persistence. Core platform models live in dedicated Prisma tables, while workflow records that are still evolving are stored durably in the `app_records` table by collection name. This keeps the frontend route contract stable without using process memory.

Every module follows:

```text
routes -> controllers -> services -> repositories
```

External providers are wrapped in adapters under `src/adapters`. Services call adapters; routes and controllers do not.

For 120,000 students and 30,000 businesses, keep these deployment assumptions:

- Postgres primary with read replicas for discovery/feed/search-heavy reads.
- Redis for rate limiting and cache/session primitives; queue, notification, and realtime fanout can reuse the same adapter boundary.
- Object storage for uploads; the upload routes are presign/complete contracts.
- Background workers for moderation, campaign stats aggregation, payouts, reminders, roadmap evidence scoring, and notification delivery.
- Cursor pagination for high-cardinality feeds and search once the frontend moves beyond page/pageSize.

## Key API Groups

| Group | Prefix |
| --- | --- |
| Auth | `/api/v1/auth` |
| Business | `/api/v1/business` |
| Earn | `/api/v1/earn` |
| Projects | `/api/v1/projects` |
| Marketing | `/api/v1/marketing` |
| Learn | `/api/v1/learn` |
| Connect | `/api/v1/connect` |
| Marketplace | `/api/v1/marketplace` |
| Finance | `/api/v1/finance` |
| Support/Wellness | `/api/v1/support` |
| Evergreen | `/api/v1/evergreen` |
| Uploads | `/api/v1/uploads` |
| Admin | `/api/v1/admin` |
