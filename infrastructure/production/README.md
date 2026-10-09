# Production deployment

This directory is a deployment baseline for one HTTPS edge, one frontend, one
API instance and one dedicated maintenance worker. PostgreSQL, Redis, private
S3-compatible storage, email and provider credentials remain managed external
services.

## Before deployment

1. Point the public DNS record at the host and allow inbound ports 80 and 443.
2. Copy `.env.example` to `.env.production` and replace every
   placeholder. Never commit the resulting file.
3. Set `SERVER_PUBLIC_URL`, `CORS_ORIGIN` and `MPESA_CALLBACK_BASE_URL` to the
   public HTTPS origin. Set `LEGAL_POLICIES_APPROVED=true` only after legal
   approval, and record the responsible entity's ODPC registration number.
4. Create a private object-storage bucket with public listing disabled,
   encryption enabled, lifecycle rules documented and credentials scoped to
   that bucket.
5. Verify a restorable database backup exists.

## Release

```sh
docker compose -f infrastructure/production/compose.yml --profile release build
docker compose -f infrastructure/production/compose.yml --profile release run --rm migrate
docker compose -f infrastructure/production/compose.yml up -d --build
curl --fail https://YOUR_DOMAIN/health
curl --fail https://YOUR_DOMAIN/ready
```

Run `npm run go-live:verify` inside the configured backend environment before
allowing real traffic. Confirm the M-Pesa verifier reports OAuth, callback,
STK and B2C readiness.

For a database that existed before the migration baseline was introduced,
review that its schema matches commit `daad272`, back it up, and mark the
baseline as already applied exactly once before the first deployment:

```sh
npm exec prisma migrate resolve -- --applied 20260826000000_baseline
```

Do not run that command on an empty database. Empty databases apply the
baseline normally through `npm run db:migrate:deploy`.

## Isolated backend verification

With Docker running, `npm run test:isolated` creates disposable PostgreSQL and
Redis services on loopback-only ports, applies every migration from an empty
database, runs the complete backend suite, and removes the containers. It does
not connect to or alter the developer database configured in `.env`.

## Backup and restore drill

Create an encrypted, access-controlled PostgreSQL dump from a trusted operator
host. Do not store dumps in this repository.

```sh
mkdir -p /secure/zumbarl-backups
pg_dump --format=custom --no-owner --file "/secure/zumbarl-backups/zumbarl-$(date -u +%Y%m%dT%H%M%SZ).dump" "$DATABASE_URL"
pg_restore --list /secure/zumbarl-backups/SELECTED.dump
```

Restore into an empty non-production database first, run `/ready`, and execute
the smoke suite against it. Record the recovery time and the operator who
verified the result. Never test restoration over the live database.

## Rollback

Keep the previous immutable image tags. Application rollback means restoring
the previous frontend/API/worker images together. Database migrations are
forward-only; if a migration cannot remain in place, deploy a reviewed
forward-fix instead of automatically reversing or restoring over live data.

## Required external operations

- Configure uptime checks for `/health` and `/ready` from outside the host.
- Alert on HTTP 5xx rate, readiness failure, worker failures, Redis/PostgreSQL
  saturation, storage errors and M-Pesa reconciliation failures.
- Ship JSON logs off-host with access controls and a retention policy.
- Test graceful termination and backup restoration before launch.
