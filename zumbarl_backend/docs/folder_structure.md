# Zumbarl Backend Folder Structure

This backend follows the layered structure from `backend_structure.html` and the stricter engineering rules applied from the Tusenti service inspection.

## Request Flow

Every HTTP request must move through the same layers:

```text
routes -> controllers -> services -> repositories
```

- `routes` registers URL paths, HTTP methods, auth middleware, and controller functions only.
- `controllers` parses request params/body/query and maps service results into HTTP responses.
- `services` owns business rules, workflow transitions, adapter calls, and cross-domain orchestration.
- `repositories` owns persistence access only. Current repositories use Prisma through shared repository primitives; controllers and routes do not know whether data lives in a normalized table or a workflow record table.

No layer can skip the next layer. A route never imports a repository. A repository never sends notifications, calls M-Pesa, calculates scores, or changes workflow policy.

## Source Layout

```text
src/
  app.ts
  server.ts
  adapters/
    cache/
    notification/
    payment/
    repositories/
    services/
    storage/
  config/
  data/
  domain/
    commands/
    events/
  entrypoint/
    api/
      controllers/
      middleware/
      routes/
    validators/
  lib/
  shared/
  startup/
```

Each domain appears across the Tusenti-style layers:

```text
entrypoint/api/routes/{domain}/
entrypoint/api/controllers/{domain}/
adapters/services/{domain}/
adapters/repositories/{domain}/
entrypoint/validators/{domain}/
```

Request validators live at the entrypoint boundary because controllers own request parsing. If an adapter needs to validate data from an external provider or persistence boundary, create a separate `src/adapters/validators/{adapter}/` folder with its own `index.ts`; do not import entrypoint validators from adapters or services.

Each folder has an `index.ts` barrel export. Imports should come from the folder boundary where practical.

## Naming Rules

Files are named after what they do:

- `registerMarketingRoutes.ts`
- `manageMarketingCampaignsService.ts`
- `marketingCampaigns.repository.ts`
- `createPrismaRecordRepository.ts`
- `redisCache.adapter.ts`
- `validateMarketingPayloads.ts`
- `mpesa.adapter.ts`

Avoid generic names like `helpers.ts`, `utils.ts`, or `misc.ts`. If a future helper is needed, name it for its behavior, for example `formatCurrency.ts`, `calculateZumbarlScore.ts`, or `createEscrowLedgerEntry.ts`.

## Adapter Rule

All external services are wrapped in adapters:

- Redis cache/rate limit client: `src/adapters/cache/redis/redisCache.adapter.ts`
- M-Pesa: `src/adapters/payment/mpesa/mpesa.adapter.ts`
- SMS: `src/adapters/notification/sms/sms.adapter.ts`
- WhatsApp: `src/adapters/notification/whatsapp/whatsapp.adapter.ts`
- Email: `src/adapters/notification/email/email.adapter.ts`
- Object storage: `src/adapters/storage/objectStorage/objectStorage.adapter.ts`

Services call adapters. Controllers and routes do not.

## Temporary Local Bucket Storage

Until Zumbarl moves to Cloudflare R2, the local adapter emulates the R2 bucket architecture from `docs/Zumbarl_Storage_Structure.pdf` under `bucket/` and exposes files through `/files/{bucket}/{storageKey}`.

The local tree mirrors the five production buckets:

```text
bucket/
  zumbarl-kyc-private/
    students/{studentId}/
    companies/{companyId}/
    safety-reports/{reportId}/
  zumbarl-gig-files/
    gigs/{gigId}/brief/
    gigs/{gigId}/submissions/
    gigs/{gigId}/proof/
    gigs/{gigId}/stats-evidence/
    gigs/{gigId}/messages/
  zumbarl-profile-private/
    students/{studentId}/cv/
    students/{studentId}/draft-uploads/
    companies/{companyId}/internal-notes/
    companies/{companyId}/team-documents/
    chamas/{chamaId}/
  zumbarl-public-assets/
    students/{studentId}/
    companies/{companyId}/
    marketplace/{listingId}/
    notes-library/{campusId}/{courseId}/
    events/{eventId}/
    clubs/{clubId}/
    platform/
  zumbarl-generated/
    certificates/{studentId}/
    invoices/{companyId}/
    roadmap-exports/{studentId}/
    placement-contracts/{placementId}/
    reports/internal/
```

PostgreSQL stores `uploaded_files.bucket`, `uploaded_files.storageKey`, size, MIME type, upload status, and metadata only. It never stores binary file contents. Seeded files are not identified by a `seed/` folder; they live in their normal bucket location, usually `zumbarl-public-assets/platform/...`, and are marked in `uploaded_files.isSeed` with source details in `metadata`.

## Persistence Rule

Postgres is accessed through Prisma only. Workflow records that do not yet have dedicated relational tables are stored in `app_records` with a `collection` key and JSON payload. That keeps the current frontend contracts durable while allowing high-volume domains to move into dedicated Prisma models later.

Redis is used for short-lived state and cache concerns. The running implementation wires Redis into Fastify rate limiting and exposes cache read/write/delete helpers through the cache adapter.

## Environment Rule

`src/config/env.ts` validates required environment variables at startup. Missing database, JWT, M-Pesa, SMS, WhatsApp, email, or object-storage configuration should crash immediately instead of failing later in production.

## Local Ports

Zumbarl uses non-default host ports because this machine already has services on the standard ones:

- Postgres: `localhost:55432`
- Redis: `localhost:56379`
