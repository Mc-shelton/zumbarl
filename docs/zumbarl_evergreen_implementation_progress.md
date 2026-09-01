# Zumbarl Evergreen Implementation Progress

Last updated: 31 August 2026

This checklist tracks verified implementation separately from the baseline estimates in `zumbarl_evergreen_implementation_plan.md`. An item is **verified** only after its server behavior, applicable UI, and required tests have been run successfully.

## Baseline audit

| Area | Disposition | Repository evidence | Gap / adaptation |
| --- | --- | --- | --- |
| User and company roles | Extend | `UserRole` already includes student transition/alumni, company pipeline/HR/hiring/viewer, operations, finance, safety, and admin roles | Public registration currently accepts the entire role enum and must be allow-listed |
| Company ownership | Fix and reuse | `CompanyContact` provides the company membership relation and JWT refreshes profile IDs from the database | Company registration currently creates only a user even though an unused transactional company-registration repository method exists |
| Authentication and broad RBAC | Replace for Evergreen actions | `requireAuth`, `requireRoles`, and database-refreshed request identity exist | Broad role groups are insufficient for formal offers, pool access, approvals, finance, overrides, and supervision |
| Roadmaps and verified evidence | Reuse | Typed roadmaps, enrollments, competencies, competency state, and `RoadmapEvidence` exist | Placement completion is not connected to roadmap/portfolio updates through durable events |
| Company/student history | Reuse | `PipelineRelationship`, engagement outcomes, endorsements, and portfolio items exist | Candidate workflow cannot use relationship summary as its source of truth |
| Transition pool | Extend | Learn services expose a basic transition pool | No availability, explicit consent snapshot, cohort eligibility, ranking version, or Evergreen privacy serializer |
| Placement | Extend in place | Existing typed `Placement` contains student/company/type/role/dates | It lacks a student relation, lifecycle status, program/cohort/candidate/offer/supervisor links, immutable terms, supervision, and active-lock integrity |
| Notifications and audits | Reuse and extend | Persistent `Notification` and append-style `AuditLog` exist | No durable outbox, delivery state, replay, or transactional Evergreen event writes |
| Projects and evidence | Reuse only as linked workspace/evidence | Project milestones, attachments/internships terms, tasks, submissions, and evidence models exist | Project lifecycle must not become the placement lifecycle |
| Billing and payments | Replace for Evergreen activation | Finance ledgers and provider adapters exist | Payment adapter behavior is not sufficient evidence of settlement; MVP needs finance-confirmed invoices and dated entitlements |
| Recurring programs and cohorts | Missing | No typed models, routes, scheduler, or UI | Implement as Evergreen-specific typed state and jobs |
| Candidate pipeline and offers | Missing | Existing opportunity bids/interviews are a different workflow | Implement typed candidates, formal versioned offers, state machines, ownership checks, and idempotency |
| Exclusive lock and acceptance | Missing | `Placement.isLocked` is only a boolean | Implement unique active lock and atomic, concurrency-safe acceptance transaction |
| Placement supervision/completion | Missing | Support cases and evidence foundations are reusable | Implement typed goals, check-ins, evidence, evaluations, amendments, status history, completion and lock release |
| Evergreen UI | Missing | Existing React route registry and business Pipeline navigation can host the workspace | Implement API-backed company, student, operations, and finance routes; preserve current unrelated UI work |

## Repository discrepancies and implementation notes

- The repository has evolved beyond the plan in roadmap/competency depth, recommendation infrastructure, support/wellbeing, and project evidence. These remain separate sources and are reused only where their semantics match.
- The existing schema and frontend contain substantial uncommitted work dated 30–31 August 2026. Evergreen changes must be additive and must not overwrite those changes.
- Existing migrations cover only recent feature deltas; the README still documents `prisma db push`. Evergreen adds a forward-only SQL migration plus explicit verification queries and does not reset any database.
- `Placement.salaryOffered` and `platformFee` use floating point. New Evergreen money fields use Prisma `Decimal`; legacy fields remain for compatibility and are backfilled where safe.
- Legacy role aliases (`student`, `business`, `admin`, and similar) remain in TypeScript compatibility code even though Prisma uses typed roles. Evergreen policy is defined only against the typed roles.

## Phase checklist

| Phase | Work item | Status | Files / migration | Tests and evidence | Known follow-up | Updated |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | E0.1 Public registration role allow-list | verified | `security.ts`, auth validator/service | 16 auth validator tests; privileged roles rejected | — | 2026-08-31 |
| 0 | E0.2 Company membership creation and ownership checks | verified | auth repository/service; Evergreen service ownership guards | Transactional company owner/contact integration test; cross-company program/candidate tests | Add HTTP-level isolation matrix to the future browser/API E2E suite | 2026-08-31 |
| 0 | E0.3 Exact Evergreen capability policy | verified | `domain/evergreen/evergreen.permissions.ts` | 18 role/capability unit tests; route prehandlers compiled | — | 2026-08-31 |
| 0 | E0.4 Durable outbox, worker lease, observability and replay | verified | outbox/receipt/lease/job models, jobs repository/service | Consumer replay exactly-once test; manual reconciliation replay completed with zero mismatches | External email delivery is not enabled; persistent in-app delivery is implemented | 2026-08-31 |
| 0 | E0.5 Feature flags and sensitive-read audit support | implemented | `FeatureFlag`, `evergreen.enabled`, protected-support read audit | Migration deployed; API feature hook compiled | Add admin flag-edit UI and an explicit feature-disable HTTP test | 2026-08-31 |
| 1 | E1.1 Typed Evergreen schema and safe migration | verified | `20260831190000_add_evergreen` through `20260831220000_enable_evergreen_feature_flag` | Prisma validate/generate/deploy passed; six verification queries returned zero violations | Backup/restore drill remains a deployment task | 2026-08-31 |
| 1 | E1.2 Qualification and pipeline opt-in policy | verified | qualification policy/service | Policy tests cover threshold, KYC, opt-in and override; threshold reads `EVERGREEN_QUALIFICATION_GIGS` | Add configuration UI for the threshold | 2026-08-31 |
| 1 | E1.3 Manual invoice and entitlement lifecycle | verified | invoice/entitlement repository, finance routes and UI | Integration covers confirmed activation, suspension/reactivation and refund | Provider callback automation deliberately excluded from MVP | 2026-08-31 |
| 1 | E1.4–E1.5 Program CRUD, transitions, review and approval | implemented | Evergreen repository/service/controller/routes | Full state-map tests and server build pass | HTTP E2E for optimistic edit/version conflict is pending | 2026-08-31 |
| 1 | E1.6 Company and operations program UI | implemented | `EvergreenWorkspacePage.jsx`, Evergreen API client/routes/styles | Targeted ESLint and production Vite build pass | Browser accessibility/E2E automation pending | 2026-08-31 |
| 2 | E2.1 Cohort lifecycle and seat invariants | verified | cohort state machine, scheduler and DB checks | Transition tests, final-seat race test and migration invariant query | — | 2026-08-31 |
| 2 | E2.2 Availability and consent | verified | availability model/service/privacy serializer/UI | Consented serializer integration excludes email/raw student record; expiry worker implemented | Add reconfirmation reminder timing customization | 2026-08-31 |
| 2 | E2.3 Readiness projection | implemented | readiness service and student UI | Policy tests and TypeScript build pass | Roadmap-verification event ingestion needs a dedicated integration test | 2026-08-31 |
| 2 | E2.4–E2.6 Eligibility, explained matching, privacy and recovery | implemented | matching policy, match-run persistence and matching job | Ranking/eligibility tests; sensitive domains absent from query and persisted exclusion snapshot | Load benchmark and safeguarding-conflict adapter remain pending | 2026-08-31 |
| 3 | E3.1–E3.3 Candidate invitation/application/interview pipeline | implemented | candidate model/transitions/routes/company UI | State tests, consent serialization and ownership integration pass | Interview calendar/change model is not yet integrated | 2026-08-31 |
| 3 | E3.4 Formal offers and authorization | implemented | typed immutable offer terms, formal-offer capability/routes/UI | Capability and cross-company tests; build pass | Offer edit/version UI is not exposed after draft creation | 2026-08-31 |
| 3 | E3.5 Atomic acceptance and active lock | verified | serializable acceptance repository/service and unique lock | Same-offer retry, two-offer student race, final-seat race and rollback tests against PostgreSQL | — | 2026-08-31 |
| 3 | E3.6 Expiry and notifications | implemented | expiry/reminder workers and in-app notification consumer | Exactly-once notification replay test | Email adapter delivery and notification-template UI pending | 2026-08-31 |
| 4 | E4.1–E4.5 Onboarding, supervision, evidence, amendments and evaluations | verified | placement workspace models/services/routes/UI | Full-loop integration covers onboarding, scheduled check-in, evidence verification, evaluation and mutual amendment | File-upload evidence uses existing references; dedicated upload UI is pending | 2026-08-31 |
| 5 | E5.1–E5.2 Completion and growth-record consumers | verified | completion transaction and idempotent growth consumer | Full-loop integration verifies portfolio, relationship, completion and duplicate-consumer protection | Analytics dashboard remains pending | 2026-08-31 |
| 5 | E5.3 Repeat-hire guardrail and mentorship alternatives | implemented | repeat-hire policy, mentorship model and operations approval route/UI | Policy tests pass; approval is audited/outboxed | Add route-level integration for mentorship approvals | 2026-08-31 |
| 5 | E5.4 Lock release and availability reconfirmation | verified | validated completion/cancellation/termination services | Cancellation and completed-loop integration verify lock deletion and paused availability | — | 2026-08-31 |
| 5 | E5.5 Recurrence and automatic next cohort | verified | timezone recurrence domain and next-cohort worker | DST/date unit tests plus completed-loop integration creates cohort 2 | — | 2026-08-31 |
| 6 | E6.1 Billing reconciliation | implemented | entitlement expiry job; finance status/refund workflow | Finance integration and manual worker replay pass | Daily external-provider reconciliation is out of MVP scope | 2026-08-31 |
| 6 | E6.2–E6.3 Exceptions, disputes, replay and dead-letter UI | implemented | operations alerts/support/failure routes and UI | Builds pass; replay consumer integration is idempotent | Browser E2E for operations resolution and dead-letter requeue pending | 2026-08-31 |
| 6 | E6.4–E6.5 Privacy/accessibility/load review and pilot runbook | in progress | allow-listed serializer, responsive semantic UI, implementation docs | Targeted lint/build and privacy integration pass | Keyboard/screen-reader audit, load test, recovery drill and pilot runbook not completed | 2026-08-31 |

## Verification log

- `npx prisma format`, `npx prisma validate`, `npx prisma generate`, and `npx prisma migrate deploy`: passed. Eleven local migrations are applied and `prisma migrate status` reports the schema up to date.
- Migration verification: six read-only integrity queries returned `[0, 0, 0, 0, 0, 0]` for invalid placement defaults, cohort counters, duplicate student locks, duplicate placement locks, offer/placement disagreement, and invalid active entitlements.
- `npm run build` in `zumbarl_backend`: passed.
- Targeted ESLint over all Evergreen/auth files: passed.
- Targeted Evergreen/security run: 61 of 61 tests passed across seven files, including the 9-scenario PostgreSQL integration suite.
- `npm test` in `zumbarl_backend`: 153 of 155 repository tests passed. Two unrelated existing tests remain red: marketing campaign discovery is deterministically missing the edited campaign; the phased application test exceeds the repository's 5-second default but passes in isolation with a 15-second timeout.
- `npx eslint ... && npm run build` over the Evergreen frontend slice: passed; Vite transformed 489 modules and emitted the lazy Evergreen bundle.
- Full frontend repository lint remains blocked by unrelated pre-existing errors in Explore/story/profile components and an unused business service import; none are in the Evergreen files.
- API service: built server listened on `http://127.0.0.1:4100`; `GET /health` returned 200, Swagger returned 200, and an unauthenticated Evergreen readiness request returned 403.
- Frontend dev service: `https://127.0.0.1:5174/` and `/campus/career/evergreen/readiness` both returned 200 HTML.
- Local PostgreSQL `55432` and Redis `56379` accepted TCP connections. The Docker CLI is unavailable on this host, so `docker compose up -d` could not be used; verification used the already-running documented local services.
- Worker replay: `placement-reconciliation` completed as run `cmthleuqj00008ac8jw0spwtb` with zero missing locks, stale locks, or seat mismatches.

## Implementation assumptions

- The first release delivers persistent in-app notifications; external email remains behind the existing adapter and is not treated as delivered without provider success.
- `EVERGREEN_QUALIFICATION_GIGS` defaults to 3 and `EVERGREEN_REPEAT_HIRE_LIMIT` defaults to 3 when deployment configuration is absent.
- Company-private evaluations are visible to the owning company and operations, never to the student. Protected support details are visible only in the audited operations workflow.
- Existing Project records may be referenced as evidence, but no Project status drives the typed placement state machine.
