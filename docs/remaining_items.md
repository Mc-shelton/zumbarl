# Zumbarl Remaining Items

Last reviewed: 7 July 2026 (full `docs/` folder sweep — all 15 documents)

This is the current implementation backlog. Completed items from
`fe-_issue_log.md` are intentionally excluded. The older
`product_process_coverage.md` understates the current backend: most product
areas now have routes and persistent models, but several frontend flows still
use mock or browser-local state and need to be connected and productionized.
A per-document review is at the end of this file.

## P0 — Make the Current Product Reliably Testable

- [ ] Make backend tests independent of a developer Redis instance, or start
  Redis automatically in the test environment. The suite currently exits
  before collecting tests when Redis is unavailable.
- [ ] Add frontend unit and integration tests; the frontend currently has no
  test script.
- [ ] Add end-to-end tests for the critical role-based flow:
  business registration/KYC → opportunity → funding → student bid/invite →
  interview → award → project submission → review → payout.
- [ ] Add end-to-end coverage for marketplace checkout/fulfilment and
  messaging/calls.
- [ ] Add CI checks for frontend build/lint and backend build/lint/test.
- [ ] Replace the generic Vite frontend README with Zumbarl-specific local
  setup, environment, architecture, and verification instructions.

## P0 — Finish Frontend-to-Backend Integration

- [ ] Remove remaining `localStorage` workflow repositories from Earn,
  business opportunities, and business marketing after their API equivalents
  are confirmed.
- [ ] Replace remaining project workspace mock data with project, milestone,
  task, file, message, submission, review, and activity APIs.
- [ ] Replace the Connect mock contribution ledger with the real chama wallet
  and ledger flow.
- [ ] Replace the student marketing mock proof form with uploaded,
  persisted, reviewable campaign proof.
- [ ] Connect Learn progress to real evidence from completed gigs, projects,
  campaigns, portfolio items, reviews, and endorsements.
- [ ] Persist opportunity intent, view preferences, and other important user
  preferences on the user profile where cross-device behavior is required.
- [ ] Remove duplicate/mock datasets after every screen reads from one
  authoritative API source.

## P0 — Complete Money Movement

- [ ] Integrate a real payment provider, including M-Pesa where applicable.
- [ ] Implement verified payment webhooks with signature checks, idempotency,
  retry handling, and reconciliation.
- [ ] Complete opportunity and milestone escrow funding, release, refund, and
  dispute paths.
- [ ] Complete student payouts and visible payout status/history.
- [ ] Add marketplace payment, cancellation, refund, and seller settlement.
- [ ] Add finance-admin reconciliation tools and immutable audit records.
- [ ] Implement the project time log required for hourly, daily, and monthly
  bids.

## P1 — Complete Core Product Workflows

### Earn, Business, and Projects

- [ ] Verify all opportunity create/edit/draft/publish/invite flows against
  persisted backend data, including refresh and another-device behavior.
- [ ] Complete interview scheduling, call lifecycle, rescheduling, and
  participant notifications.
- [ ] Finish repeat-hire guardrails with real mentorship/coaching operations,
  not only unlock state.
- [ ] Make completed projects update student skills, roadmap progress,
  portfolio evidence, endorsements, and trust score through domain events.
- [ ] Complete revision limits, scope-change approval, dispute escalation, and
  final project closure.
- [ ] Enforce the deliverables framework beyond form metadata
  (`deliverables_workflow.md`): originality/plagiarism checks, AI-content
  indicators, GitHub/live-demo verification, EXIF/GPS proof validation,
  analytics/API metric verification, watermark policy, sequential submission
  locks, and staged escrow release per component.
- [ ] Implement proof-based gig safeguards: the advance-disbursement wallet
  gate for transport, and the non-waivable night/unverified-location safety
  rules (fully KYC-verified company + live location sharing).

### Trust, Reputation, and Roles

- [ ] Build the reputation engine (`ai notes.md`, `ai notes_kyc.md`): trust
  score from completion rate, disputes, complaints, lateness, repeat-client
  weighting, endorsements, and campus verification level — replacing the
  static profile trust metrics.
- [ ] Implement identity risk tiers that gate capability (browse → apply →
  financial flows → errands → mentor/train) instead of a single verified flag.
- [ ] Expand RBAC to the full role matrix in `ai_notes_roles.md`: student
  transition mode (automatic unlock) and 12-month alumni window; company
  sub-roles (Pipeline Partner, HR Manager, Hiring Manager, Viewer); internal
  roles (Operations, Campus Manager, Safety Officer, Finance Officer, Content
  Moderator) — enforced server-side, with Safety Officer access siloed from
  everything else.
- [ ] Extend KYC to the four layers in `ai notes_kyc.md`: identity gaps
  (selfie/liveness, emergency contact, M-Pesa ownership verification, device
  fingerprint), business gaps (KRA PIN, verified company email, named
  representative), trust KYC, and financial KYC before enabling money
  features.

### Compliance and Legal (`ai notes_dp.md`)

- [ ] Register with the ODPC as a data controller before handling real student
  data at scale.
- [ ] Publish a privacy policy, terms of service, internal data protection
  policy, and an explicit consent framework (KYC, counseling, financial
  profiling, location, notifications, marketing).
- [ ] Define retention and deletion rules for sensitive categories (IDs,
  finances, counseling and mental-health data, locations).

### Marketplace

- [ ] Connect seller shop, inventory, gallery, stock, variants, and service
  bookings to persistent APIs.
- [ ] Complete order status transitions and enforce buyer/seller permissions.
- [ ] Implement approved campus pickup/drop-off, handoff confirmation, and
  delivery evidence.
- [ ] Complete reviews, disputes, refunds, and their trust-score effects.
- [ ] Add robust marketplace search, filters, pagination, and campus
  availability rules.

### Connect, Messaging, and Calls

- [ ] Complete production media upload for stories, posts, profiles, shops,
  opportunities, messages, and submissions.
- [ ] Verify realtime messaging, presence, incoming calls, reconnects, missed
  calls, and notification behavior.
- [ ] Complete group/club administration, member roles, removal, and reporting.
- [ ] Complete feed moderation, spam controls, report review, and sanctions.
- [ ] Finish cross-surface links for people, products, projects, events,
  groups, and opportunity tags.

### Learn and Career Progression

- [ ] Replace mock roadmap state with API-backed enrollment and progress.
- [ ] Add real mentor, coaching, program, certification, and opportunity
  recommendation inventory.
- [ ] Define and enforce skill-level, tier-upgrade, endorsement, and transition
  pool rules.
- [ ] Show students why evidence was accepted or rejected and how it affected
  their career progress.

### Wellness and Safety

- [ ] Finish student-facing anonymous support, counseling booking, case status,
  and escalation screens.
- [ ] Finish counselor/support dashboards with assignment, notes, privacy
  controls, and resolution workflow.
- [ ] Define emergency escalation and response-partner procedures outside the
  application.
- [ ] Apply strict access, retention, and audit rules to sensitive wellness and
  safety data.

## P1 — Production Infrastructure and Security

- [ ] Move uploads from the repository-local bucket to production object
  storage with private access, signed URLs, validation, malware scanning, and
  cleanup.
- [ ] Add background workers/queues for email, notifications, moderation,
  campaign statistics, payouts, reminders, and evidence scoring.
- [ ] Configure reliable realtime fanout for multiple backend instances.
- [ ] Add database migrations and deployment-safe migration procedures instead
  of relying on `prisma db push`.
- [ ] Add structured logs, error tracking, metrics, traces, uptime checks, and
  alerting.
- [ ] Add database backups and test restoration.
- [ ] Review authentication/session expiry, account recovery, RBAC, KYC access,
  rate limits, CORS, secrets, and audit coverage.
- [ ] Add privacy controls for export, deletion, consent, and retention.
- [ ] Load-test discovery, feed, search, messaging, and high-cardinality lists;
  adopt cursor pagination where needed.

## P2 — Product and UX Hardening

- [ ] Consolidate duplicated theme tokens and reduce oversized feature CSS
  files (workplan step 2 — still pending).
- [ ] Move route metadata into a structured route/access registry instead of
  scattering access definitions across `App.jsx` and feature files (workplan
  step 3 — partially done via `routeConfig.jsx`; finish and enforce).
- [ ] Fix product positioning copy: the first line of `copywrites.md`
  (CRM/warehouse/POS) describes the wrong product; standardize on the
  student-ecosystem copy across landing pages and SEO constants.
- [ ] Complete mobile, tablet, keyboard, screen-reader, loading, empty, error,
  and offline states across all primary flows.
- [ ] Add route-level error boundaries and consistent API error handling.
- [ ] Audit large frontend bundles and lazy-load heavy pages/components.
- [ ] Add product analytics for activation, opportunity conversion, successful
  delivery, repeat hiring, marketplace completion, and retention.
- [ ] Keep process documentation and the coverage matrix synchronized with
  every completed workflow.

## Later Product Scope

These ideas remain valid but should follow a stable Earn/Business/Marketplace
core.

- [ ] Full digital chamas: contribution rules, group wallets, approved payees,
  lending, investment, governance, and fraud controls.
- [ ] Student budget helper, savings goals, earn-to-pay plans, and responsible
  micro-advances.
- [ ] Knowledge marketplace for notes, past papers, libraries, tutoring, and
  learning resources.
- [ ] Student services such as errands, printing, laundry, delivery, and
  queueing with trust and handoff controls.
- [ ] Events, volunteering, student affairs, and campus business discovery.
- [ ] WhatsApp/Telegram/social distribution, referrals, and ambassador tools.
- [ ] Bank, supermarket, eatery, printing, university, and partner
  integrations.
- [ ] University SaaS such as attendance, grading, fees, classrooms,
  assignments, and student portals.

## Source Document Review (7 July 2026)

Every file in `docs/` was reviewed against the current codebase. Status of
each document and where its open items live in this backlog:

| Document | What it holds | Status | Open items |
| --- | --- | --- | --- |
| `fe-_issue_log.md` | Frontend issue punch list | **All 26 items closed** (checked off in the file) | None |
| `ai_notes_workplan.md` | 10-step build plan | Steps 4–5 (Earn + Business flows) largely built at UI level with partial backend; step 1 matrix exists | Step 2 theme system and step 3 route/access registry → P2; steps 6–10 → P1 sections and Later Scope |
| `product_process_coverage.md` | Pillar coverage matrix | **Outdated** — understates current backend | Refresh after each P0 integration lands (tracked in P2 "keep docs synchronized") |
| `zumbarl_processes.md` | Canonical process definitions (gig, marketing, project, learn, connect, marketplace) | Gig/marketing/project flows modeled in UI + partial backend; learn/connect/marketplace mostly mock | P0 integration + P1 workflow sections |
| `zumbarl_ai_workflows.md` | Same processes translated to states/entry points | Living doc; matches current UI states reasonably well | Update as P1 workflows complete |
| `deliverables_workflow.md` | Six deliverable types, verification, disputes | Types + metadata exist in the create form (`DELIVERABLE_TYPE_META`); verification/enforcement absent | New items under "Earn, Business, and Projects" |
| `ai_notes_roles.md` | Full role/permission matrix, both sides + internal | Frontend `ACCESS_KEYS`/roleConfig covers a subset; no server-side RBAC for company sub-roles, transition/alumni, or internal roles | New "Trust, Reputation, and Roles" section |
| `ai notes.md` | Missing-infrastructure review (trust, escrow, risk tiers, compliance, safety, moderation, recommendations) | Escrow/moderation partially in backlog already | Reputation engine + risk tiers added; parent/guardian view, campus mapping, recommendation engine noted in Later Scope |
| `ai notes_kyc.md` | Four-layer KYC requirements | Basic identity/business KYC pages exist (`BusinessKycPage`, student onboarding) | Four-layer KYC item under "Trust, Reputation, and Roles" |
| `ai notes_dp.md` | ODPC/data-protection obligations | Nothing implemented | New "Compliance and Legal" section |
| `ideation_notes.md` | Raw product vision + launch strategy | Vision source; Earn/Business core in progress; chamas, budget helper, libraries, errands, integrations not started | Later Product Scope; launch mechanics (first-1800, connectors, WhatsApp distribution) are business ops, not tracked here |
| `ai_notes_ideation.md` | Structured vision (pillars, trust layer, growth engine) | Same as above | Same as above |
| `zumbal_ai_feedback.md` | Strategy critique (focus, trust, MVP = trusted student gigs) | Decision guidance — supports current Earn-first priority | No code items; revisit when choosing the single V1 entry point |
| `apps_from_docs.md` | Extracted app inventory (16 core + 6 growth) | Inventory only | Mapped to Later Product Scope |
| `copywrites.md` | Positioning copy drafts | First line describes the wrong product (CRM/warehouse/POS) | Copy standardization item → P2 |

## Release Definition of Done

A workflow is complete only when it:

- persists through the backend and survives refresh/sign-in on another device;
- enforces role and ownership permissions on the server;
- handles loading, empty, validation, failure, retry, and duplicate requests;
- has automated happy-path and failure-path coverage;
- emits the required notification and audit events;
- has an observable production path with no mock data required.
