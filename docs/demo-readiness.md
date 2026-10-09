# Core Gig-to-Career Demo Readiness

This document defines the release boundary for the controlled Zumbarl demo.
It separates functionality that must work from future ideas that must not be
misrepresented as available.

## Demo promise

The demo is ready when the following connected journey works with persisted
data and without manual database intervention:

```text
Business publishes and funds an opportunity
                         ↓
Student discovers it and submits a priced application
                         ↓
Business awards the application and opens the project
                         ↓
Student completes tasks, communicates and submits evidence
                         ↓
Business reviews the work and completes the engagement
                         ↓
Payment, verified work, skills and career progress update once
```

The marketing proof journey is a supporting demo: a student accepts a campaign,
adds platform-specific post URLs, uploads matching analytics screenshots, saves
unread metrics as `null`, and submits exactly one review package.

## Delivery phases

### Phase 1 — Release foundation

- [x] Reconcile the local database with all committed Prisma migrations.
- [x] Keep an idempotent demo seed for the actors and each required journey state.
- [x] Document demo accounts, starting routes and expected outcomes.
- [x] Keep future credentials visibly separate from implemented credentials.

### Phase 2 — Journey reliability

- [x] Verify publish, funding, discovery, application and award.
- [x] Verify project creation, tasks, messages, submission and business review.
- [x] Verify completion creates one payment and one verified engagement outcome.
- [x] Integrate receipt-confirmed M-Pesa STK funding and idempotent B2C wallet
  withdrawals with one-time failure refunds.
- [ ] Pass Daraja OAuth and controlled STK/B2C sandbox transactions in the demo
  environment. See [M-Pesa integration](./mpesa-integration.md).
- [x] Verify completion updates the matching skill and career stage without
  crediting unrelated skills.
- [x] Verify campaign URL validation, nullable metrics and single submission.
- [ ] Add actionable loading, success and failure feedback to every blocking action.

### Phase 3 — Repeatable acceptance

- [x] Add browser smoke coverage for the seeded student project, proof-ready
  campaign and business application states.
- [ ] Automate the mutating publish → apply → award → submit → review journey.
- [ ] Run and sign the career acceptance suite.
- [ ] Run and sign the Student Care suite when Student Care is included in the demo.
- [ ] Verify the target layouts at 390 px, 768 px and 1440 px.
- [ ] Complete keyboard, focus, zoom and screen-reader smoke checks.

### Phase 4 — Demo checkpoint

- [x] Clear repository-wide frontend lint failures.
- [x] Run Prisma generation, backend build/tests, frontend lint and frontend build.
- [x] Record the tested baseline, environment, actors and evidence.
- [x] Ignore newly generated browser output and untracked local bucket uploads.
- [ ] Review historical tracked runtime/private files before creating the demo commit.
- [ ] Create the clean demo checkpoint commit after the pre-existing mixed working
  tree has been reviewed.

## Explicit future functionality

### Expert promotion

Expert is not currently an awardable Zumbarl credential. A future implementation
must introduce an authorized reviewer, a review queue, evidence requirements,
an auditable decision, appeal/retry handling and a durable credential record.
Until then, the UI may explain Expert as a future milestone but must not imply
that accumulated XP automatically awards it.

### Mentor promotion

Mentor is not currently an awardable Zumbarl credential. A future implementation
must require Expert status plus suitability, safeguarding and mentoring-quality
review. It must define revocation, reporting and supervision before mentors can
be recommended to students. Until then, Mentor must remain a labelled future
milestone rather than an active role or credential.

## Out of scope for this demo

Chamas and lending, bank or supermarket payment partnerships, WhatsApp and
Telegram integrations, food networks, university administration SaaS and other
longer-term concepts remain product-roadmap candidates. They do not block this
demo and should not be shown as functioning capabilities.

## Demo environment

From `zumbarl_backend`, prepare and verify the local demo state with:

```bash
npm run demo:seed
npm run demo:verify
```

The reset touches only records with dedicated `demo-*` identifiers. In
particular, it clears proof packages only for the dedicated proof-ready campaign
so the submission can be demonstrated again.

| Actor | Email | Password |
| --- | --- | --- |
| Student | `student@zumbarl.test` | `password123` |
| Business | `business@zumbarl.test` | `password123` |

| State | Starting route |
| --- | --- |
| Published, funded opportunity with submitted application | `/campus/opportunities?opportunity=demo-opportunity-ready-for-award` |
| Active funded project with tasks and messages | `/campus/projects/demo-project-campus-launch` |
| Accepted campaign ready for proof | `/campus/opportunities/marketing/demo-campaign-proof-ready` |

Expected starting evidence includes a positive student wallet balance, verified
skills, an active learning roadmap, one award-ready application, three project
tasks, two project-group messages and no pre-existing proof for the demo
campaign.

## Verification record — 9 September 2026

This run used branch `feature/social-first-layout`, baseline commit `fac75b8`,
Node `v26.5.0`, npm `11.17.0`, local PostgreSQL and Google Chrome through
Playwright. The working tree already contained a broad set of uncommitted
product changes, so `fac75b8` identifies the baseline rather than a release
commit.

| Check | Result | Evidence |
| --- | --- | --- |
| Prisma migration alignment | PASS | All 24 committed migrations are applied, including the M-Pesa payment record and audit relations. |
| Deterministic demo data | PASS | Funded opportunity with one bid; project with 3 tasks and 2 messages; accepted campaign with 0 proofs; wallet, 11 skills and 2 roadmaps. |
| Backend compilation | PASS | TypeScript build completed without errors. |
| Backend automated suite | PASS | 41 test files; 220 tests. |
| Frontend lint | PASS | 0 errors and 0 warnings. |
| Frontend production build | PASS | Vite production build completed. |
| Browser smoke suite | PASS | 3 Chrome journeys: student project/messages, student campaign proof state, and business opportunity/application state. |
| Whitespace/error-marker check | PASS | `git diff --check` returned no errors. |

This record does not sign off the manual career suite, Student Care suite,
responsive layouts, keyboard/focus/zoom/screen-reader checks, or the fully
mutating browser journey. Those remain explicit gates above.

## Payment verification addendum — 10 September 2026

STK Push opportunity funding, authenticated status reads/reconciliation,
receipt-validated callbacks, atomic escrow accounting, and direct student B2C
withdrawals are implemented. Callback replays cannot move money twice, active
requests suppress repeat provider initiation, explicit B2C failure/timeout
results refund once, and ambiguous network outcomes remain reserved for safe
reconciliation.

The implementation is not yet marked live: `npm run mpesa:verify` confirms the
callback origin is public HTTPS, but the configured sandbox OAuth pair returns
HTTP 400 and the B2C initiator/security credential variables are absent. A
successful and cancelled STK transaction plus a successful and failed B2C
transaction remain the external sign-off gate.

## Release verification record — 4 October 2026

The release checks now run without using the developer database. The isolated
backend command creates disposable PostgreSQL and Redis services, applies the
entire migration chain from an empty database, runs the suite, and removes the
services. The browser demo command uses the same isolation.

| Check | Result | Evidence |
| --- | --- | --- |
| Fresh database migration chain | PASS | All 27 migrations applied from empty, including the new pre-migration baseline. |
| Backend automated suite | PASS | 47 test files; 246 tests. |
| Backend lint/build | PASS | ESLint and TypeScript compilation completed without errors. |
| Backend production dependency audit | PASS | No production vulnerabilities reported. |
| Frontend unit suite | PASS | 2 test files; 7 marketplace-pricing and role-access tests. |
| Frontend lint/build | PASS | ESLint and the Vite production build completed without errors. |
| Frontend production dependency audit | PASS | No vulnerabilities reported. |
| Isolated browser demo suite | PASS | 17 Chrome journeys passed against a freshly migrated and seeded database. |
| Production container builds | PASS | Backend runtime and frontend nginx images built successfully. |

This does not approve public launch. The repository-history privacy cleanup,
clean release commit, valid production environment and managed services,
legal/ODPC approvals, backup-restore drill, monitoring, and controlled Daraja
STK/B2C outcomes remain external release gates.
