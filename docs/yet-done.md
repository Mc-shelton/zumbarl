# Go-live status

Last verified: 30 September 2026

We are not ready for an unrestricted public production launch. The core app and its persisted workflows run end to end, but launch is still blocked by sensitive-data cleanup, external production services, live payment sign-off, legal approval/registration, and unfinished financial controls.

## Implemented and verified

- Runtime Earn, business opportunity, business marketing, project workspace, talent browsing, marketplace browsing, profile, and checkout screens now read their records from backend APIs. Browser-local workflow repositories and static record fallbacks were removed.
- Business student/service discovery uses authenticated `GET /api/v1/business/talent`; public profile, skill, service, portfolio, and relationship fields come from persisted records.
- Project, team, milestone, files, submissions, reviews, activity, interviews, awards, and checkout states no longer silently substitute demo records when an API request fails.
- Fake saved cards, generated payment references, canned order confirmations, sample profile scores/earnings/products, hardcoded interviewers, and no-op task/milestone dialogs were removed.
- Signed-out users no longer inherit student permissions. The role is derived from the authenticated backend identity.
- Seed identities are idempotent and remain opt-in development/test fixtures; the application server does not seed them during normal startup.
- Live smoke checks passed for API health, business authentication, and the business talent endpoint.
- Production configuration now fails fast for private/non-HTTPS public URLs, local production storage, disabled TLS verification, placeholder secrets, unsafe CORS origins, and incomplete B2C credentials.
- `/ready` now checks PostgreSQL, Redis, and configured S3-compatible storage with bounded timeouts and returns HTTP 503 when a required dependency is unavailable.
- The API has request/connection/keep-alive timeouts, graceful SIGTERM/SIGINT shutdown, callback-token-safe request logs, production-disabled Swagger UI, and explicit migration/release commands.
- Uploads support authenticated S3-compatible storage. Non-public local files are no longer exposed by the public static-file route.
- Authentication tokens now expire, map to revocable database sessions, and are mirrored into an HTTP-only `SameSite=Lax` cookie for protected browser reads such as private images. Cookie-only write requests are rejected, and logout clears the cookie and revokes the session.
- Login OTP delivery is restricted to active users that already exist in the database. Unknown and inactive addresses receive the same opaque public response but no email and no usable code, preventing account enumeration. Registration email verification remains a separate new-account flow.
- Public privacy, terms, and safety pages now replace placeholder links. Registration requires explicit terms and privacy acknowledgement, and the accepted version and timestamp are stored on the user record. Production startup remains gated on legal approval and an ODPC registration number.
- Recurring maintenance work can run in a dedicated worker instead of every API instance. Production configuration requires that external-worker mode.
- Production Docker images, an HTTPS Caddy edge, Nginx API/readiness proxying, a Compose topology, and release/backup/rollback instructions are available under `infrastructure/production/`.
- Known production dependency advisories were removed; backend and frontend production dependency audits report zero vulnerabilities.
- CI now runs migrations, lint, build, tests, and production dependency audits. Runtime uploads have been removed from the Git index while remaining available in the local ignored bucket.
- `npm run release:prepare` applies schema and one-time data migrations; `npm run go-live:verify` runs the build, dependency audit, and non-transactional M-Pesa gate in the deployment environment.
- Verification passed:
  - frontend lint and production build;
  - backend lint and TypeScript check;
  - 47 backend test files, 246 tests;
  - 17 browser end-to-end tests covering authentication/session handling, public policies, student and business projects, submissions/reviews, campaign proof, learning, profiles, and business opportunities.

## Hard blockers

1. **Potential sensitive-data exposure in Git**
   - Runtime upload files and non-placeholder private/KYC files have been removed from the current Git index, without deleting the local files.
   - They still exist in earlier Git history. Purge the affected history, rotate/revoke exposed records as needed, and document the incident decision before deployment.

2. **M-Pesa is not live-ready**
   - Daraja sandbox OAuth now passes after correcting `MPESA_BASE_URL` to the provider origin.
   - The callback origin is still a private/LAN URL rather than a publicly routable HTTPS backend URL, and B2C credentials are missing.
   - Successful/cancelled STK and successful/failed B2C sandbox transactions still need sign-off. See [mpesa-integration.md](./mpesa-integration.md).

3. **Production object storage is not configured**
   - An S3-compatible adapter, signed operations, authenticated private-file reads, and storage readiness checks are implemented, but the current environment still selects `provider: 'local'` and points at localhost.
   - Configure and verify a real private object-storage bucket. Malware scanning, retention, and cleanup policies still need an operating service.

4. **Privacy and compliance controls are incomplete**
   - Operational privacy, terms, and safety drafts plus versioned registration consent are implemented.
   - Kenyan legal approval, the designated data-protection owner, ODPC registration, retention/deletion/export controls, and sensitive-data access rules remain open.
   - This affects KYC, finance, location, counseling, and wellness data.

5. **No deployed production operating environment**
   - CI, bounded readiness, graceful shutdown, HTTP timeouts, deployment-safe migrations, dedicated maintenance workers, production images, HTTPS routing, and an operator runbook are now present.
   - Actual production infrastructure, tested backup restoration, durable error tracking, metrics, alerts, uptime monitoring, remaining async queues, and multi-instance realtime fanout are not complete. See [availability_spec.md](./availability_spec.md).

6. **The release candidate is not controlled**
   - The working tree remains very large and dirty, including the staged removal of historical runtime uploads.
   - Create a reviewed checkpoint and deploy the exact verified revision before staging acceptance.

7. **Financial and safety paths remain incomplete**
   - Escrow release/refund/disputes, production payouts, marketplace settlement/refunds, finance reconciliation, complete RBAC/KYC gates, moderation, and safety escalation still require work.

## Launch call

- **Public launch with real users, KYC, and money:** no-go.
- **Controlled demo with explicitly seeded development data:** technically verified, but first contain the tracked private files and create a clean release checkpoint.
- **Invite-only beta:** viable only with real-money, sensitive KYC/wellness, marketplace settlement, and incomplete modules disabled or clearly feature-gated.

Shortest route: purge the Git data exposure → provision the public domain, managed database/Redis and real S3 storage → add B2C credentials → complete M-Pesa sandbox sign-off → obtain legal/ODPC approval → freeze a narrow Earn/Business scope → deploy a clean staging revision → run backup restoration and mutating acceptance tests against staging.
