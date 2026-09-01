# Zumbarl Evergreen — Master Implementation Prompt

Use this prompt with a coding agent that has access to the complete Zumbarl repository. It is intentionally implementation-oriented: the agent must inspect the existing application, make working changes, test them and report evidence rather than merely producing another proposal.

## Copy-ready prompt

```text
You are the lead product engineer responsible for implementing Zumbarl Evergreen end to end in the existing Zumbarl repository.

Your objective is to deliver a production-ready continuous internship and industrial-attachment recruitment loop for verified students and SMEs. The completed loop is:

verified student readiness
→ explicit placement availability and consent
→ qualified company and approved recurring program
→ scheduled or manually opened cohort
→ explained candidate matching
→ invitation/application and interview pipeline
→ formal offer
→ atomic acceptance and exclusive active-placement lock
→ onboarding and supervised placement
→ verified completion evidence
→ roadmap, portfolio and relationship updates
→ lock release and availability reconfirmation
→ automatic next cohort

Do not reduce Evergreen to a vacancy board, a collection of mock screens or a renamed project workflow. The continuous loop and its integrity constraints are the product.

## Authoritative context

Read these files completely before changing code:

1. `docs/zumbarl_evergreen_implementation_plan.md` — primary product and technical contract.
2. `docs/apps_from_docs.md` — application placement in the broader roadmap.
3. `docs/ideation_notes.md` — original placement, exclusivity and repeat-hire concepts.
4. `docs/zumbarl_processes.md` — project, learning, evidence and transition processes.
5. `docs/ai_notes_roles.md` — role boundaries and company pipeline capabilities.
6. `docs/remaining_items.md` — known platform gaps and definition-of-done expectations.
7. Relevant repository-level `AGENTS.md`, README, package manifests, Prisma schema, route registration, authentication, authorization, notification, payment, project, Learn/roadmap, portfolio and company-pipeline code.

Treat the Evergreen plan as the target contract. Where the repository has evolved beyond the document, preserve working behavior and record the discrepancy before adapting the implementation. Do not silently override an explicit product invariant.

## Current baseline to verify

The repository is expected to contain some of these foundations. Verify them instead of assuming exact paths or completeness:

- Prisma roles for students, transition/alumni users and company pipeline users.
- `PipelineRelationship` or an equivalent company/student relationship summary.
- career roadmaps, roadmap enrollment and verified evidence synchronization.
- a basic transition-pool backend endpoint.
- a skeletal `Placement` model.
- general notifications and audit logs.
- project terms for stipend roles, attachments and internships.
- partial company pipeline UI or browser-local applicant-review behavior.
- incomplete/stubbed external payment and messaging adapters.
- route → controller → service → repository backend conventions.

Before implementation, produce a concise baseline matrix showing what is reusable, what must be extended, what must be replaced and what is missing. Then proceed with implementation; do not stop after the audit.

## Fixed first-release product decisions

Implement these unless the source documents contain a newer explicit decision:

1. The first release supports `INTERNSHIP` and `ATTACHMENT` placements.
2. Matching recommends and explains; it never automatically rejects a student.
3. Students must explicitly opt into placement discovery and consent to company-visible fields.
4. A student may receive multiple offers but may accept only one active placement.
5. The exclusive lock is acquired only when an offer is accepted, never when an invitation or offer is sent.
6. Offer acceptance, seat reservation, placement creation and lock acquisition must commit atomically.
7. A company must be KYC-approved and be a qualified Pipeline Partner or have a documented operations override.
8. Standard qualification is three successfully completed verified gigs plus pipeline opt-in; make the threshold configurable.
9. Student eligibility requires approved identity status, transition access or an override, verified readiness, current availability and consent.
10. Existing projects can contribute evidence or be linked as workspaces, but placement lifecycle and supervision remain typed Evergreen concerns.
11. MVP Evergreen billing uses a finance-confirmed manual invoice and dated entitlement. Do not activate service from an unconfirmed or stubbed M-Pesa response.
12. Company private notes are never shown to students.
13. Wellbeing, safety-circle, health and other sensitive support data must not be matching inputs or company-visible data.
14. An open cohort with no accepted/started placements is open, not “live.” Live means at least one accepted placement has started.
15. Repeat hiring must be limited by the configured guardrail unless the company records an approved mentorship alternative such as an office tour, shadowing or structured performance advice.

## Security prerequisites

Treat these as Phase 0 release blockers and verify whether they remain present:

- Public registration must accept only public self-service roles. Never allow a caller to self-assign internal, administrative, finance or privileged company roles.
- Company registration must create a valid company membership/ownership relation.
- Every company request must verify both capability and company ownership.
- Formal-offer, pool-access, approval, finance, override and supervision permissions must be enforced on the server.
- Candidate and offer identifiers must not permit cross-company enumeration.
- Administrative overrides and sensitive reads must be audited.

Fix confirmed blockers before exposing Evergreen data. Add regression tests proving that they are fixed.

## Required domain model

Use typed Prisma models and explicit relations for primary business state. Do not put the core lifecycle in a generic JSON workflow record.

Implement or equivalently model:

- `EvergreenProgram`
- program skill/competency requirements
- program supervisors
- `EvergreenCohort`
- `EvergreenCandidate`
- `PlacementAvailability`
- `PlacementOffer`
- `ActivePlacementLock`
- extended existing `Placement`
- `PlacementGoal`
- `PlacementCheckIn`
- `PlacementEvidence`
- `PlacementEvaluation`
- `PlacementAmendment`
- append-only `PlacementStatusEvent`
- `EvergreenEntitlement`
- `EvergreenInvoice`
- `EvergreenOverride`
- `EvergreenMatchRun`
- durable `OutboxEvent` or the repository’s equivalent

Reuse existing users, companies, skills, competencies, roadmaps, portfolio records, endorsements, notifications, audit records and pipeline relationships where their semantics match.

Extend the existing `Placement` model rather than creating a second unrelated placement concept. Add explicit student and company relations and links to the program, cohort, candidate, accepted offer and supervisor.

The active-lock table represents current locks only. Enforce one row per student and one row per placement with database uniqueness. Preserve historical acquisition/release information through placement status history and audit records.

Add appropriate foreign keys, restrictive deletion behavior, compound indexes, fixed-decimal money plus ISO currency, UTC timestamps, IANA recurrence timezone and optimistic version fields where concurrent editing is possible.

Use safe, forward-only migrations. Preserve existing placement data. When a migration requires backfilling or reinterpretation, write an explicit backfill and verification query. Do not reset or erase the database.

## Required state machines

Centralize transition rules in domain services. Controllers and clients request actions; they must not assign lifecycle statuses directly.

Program:
`DRAFT → PENDING_REVIEW → ACTIVE → PAUSED → ARCHIVED`

Additional program paths:
`PENDING_REVIEW → CHANGES_REQUESTED → PENDING_REVIEW`
`ACTIVE → SUSPENDED → ACTIVE`

Cohort:
`SCHEDULED → OPEN → MATCHING → INTERVIEWING → FILLED | PARTIALLY_FILLED → IN_PROGRESS → COMPLETED`

Exceptional cohort states:
`PAUSED`, `CANCELLED`

Candidate:
`MATCHED → INVITED | APPLIED → SHORTLISTED → INTERVIEWING → OFFERED → ACCEPTED → STARTED → COMPLETED`

Alternate/terminal candidate states:
`DECLINED`, `WITHDRAWN`, `REJECTED`, `OFFER_EXPIRED`, `TERMINATED`

Offer:
`DRAFT → SENT → VIEWED → ACCEPTED | DECLINED | EXPIRED | WITHDRAWN`

Placement:
`PENDING_ONBOARDING → READY → ACTIVE → COMPLETION_REVIEW → COMPLETED`

Exceptional placement states:
`DEFERRED`, `CANCELLED_BEFORE_START`, `TERMINATED`, `DISPUTED`

Add unit tests for every permitted transition and representative forbidden transitions. Return stable conflict/error codes to clients.

## Critical acceptance transaction

Implement offer acceptance as a single database transaction with concurrency protection:

1. Authenticate the student and verify offer ownership.
2. Lock or serialize access to the student’s placement-availability/lock boundary.
3. Verify the offer is sent, open and unexpired.
4. Verify the cohort is eligible for acceptance and has an unreserved seat.
5. Verify the student has no active placement lock.
6. Create the placement from the immutable offer terms.
7. Create the unique active-placement lock.
8. Reserve/fill the cohort seat using a concurrency-safe update.
9. Mark offer and candidate accepted.
10. Expire or close the student’s other open offers according to policy.
11. Write the audit record and durable outbox event in the same transaction.

The endpoint must be idempotent. Two simultaneous accept requests for one student must produce one accepted placement. Two students competing for the last seat must not overfill the cohort. Add integration tests that actually exercise those races against the supported database.

## Matching and readiness

Separate hard eligibility from ranking.

Hard filters include:

- approved student identity state;
- transition access or recorded override;
- active, unexpired availability and consent;
- placement type and date compatibility;
- location/work-mode compatibility;
- mandatory competency prerequisites;
- absence of an active placement lock;
- no safeguarding or company/student conflict that legally blocks the match;
- open cohort.

Rank only eligible students using explainable signals such as:

- verified competency and skill coverage;
- relevant project and portfolio evidence;
- roadmap stage and evidence freshness;
- role interests and schedule fit;
- verified endorsements;
- compliant prior company relationship.

Do not use health, wellbeing, safety-circle participation, disability disclosure, financial distress or other protected/sensitive data as ranking signals.

Persist the algorithm version, input snapshot and concise reasons. Display reasons such as “3 of 4 required competencies verified” and “dates and remote preference align.” Keep final shortlisting and rejection human-controlled.

## Backend implementation

Follow the repository’s established modular architecture. Prefer a dedicated Evergreen module with route, controller, validator, domain service, repository, permissions, events, jobs and matching concerns separated cleanly.

Expose a coherent API under `/api/v1/evergreen` or the project’s equivalent versioned namespace.

Required company capabilities:

- inspect eligibility and entitlement;
- create, edit, submit, pause and view programs;
- create and manage cohorts;
- view consented candidate lists;
- invite, shortlist, interview and reject candidates;
- compose, send and withdraw formal offers;
- manage assigned placements, goals, check-ins and evaluations.

Required student capabilities:

- inspect readiness and evidence gaps;
- set, reconfirm and pause availability;
- view explained matches;
- apply and respond to invitations;
- view, accept and decline offers;
- complete onboarding;
- submit check-ins, evidence and completion material;
- view placement history and request help.

Required operations/finance capabilities:

- review and approve programs;
- grant expiring, reasoned overrides;
- inspect placement alerts and resolve exceptions;
- issue/confirm/refund invoices and entitlements;
- replay failed jobs/events without duplication.

Backend requirements:

- validate request and response shapes;
- exact capability checks plus record ownership;
- cursor pagination for growing lists;
- stable `409` conflicts for invalid transitions/concurrency;
- idempotency keys for consequential retries;
- allow-listed candidate serializers;
- server-derived `allowedActions` where useful;
- transactionally consistent audit/outbox writes;
- no browser-local record as source of truth.

## Events and background workers

Implement durable domain events for at least:

- roadmap verified;
- transition enabled;
- availability changed;
- company qualified;
- program activated;
- cohort opened;
- matching completed;
- candidate state changed;
- offer sent and accepted;
- placement started;
- check-in overdue;
- placement completed;
- lock released;
- cohort completed.

Business state and its outbox record must commit together. Consumers must be idempotent and observable.

Implement scheduled workers for:

- cohort creation/open/close;
- matching dispatch and recovery;
- offer expiry;
- availability expiry/reconfirmation;
- onboarding/check-in/completion reminders;
- placement and lock reconciliation;
- entitlement reconciliation;
- next-cohort planning.

Every recurring worker needs a distributed lock or equivalent single-run guarantee, bounded retries, failure visibility and manual replay. Do not hide failures in logs only.

## Frontend implementation

Build responsive, accessible workspaces using the existing design system and route conventions.

Company routes should cover:

- Evergreen landing/qualification;
- new/edit program;
- program and cohort detail;
- candidate pipeline and detail;
- offer composer/detail;
- active placement roster and supervision.

Student routes should cover:

- readiness;
- placement availability/privacy;
- matches;
- applications/invitations;
- offer detail and acceptance;
- onboarding, active placement, check-ins and completion.

Operations routes should cover:

- program review;
- cohort monitoring;
- placement alerts;
- exceptions/overrides;
- billing/entitlements.

Connect the existing business Pipeline navigation item to the Evergreen workspace when available.

For candidate and event activity, use compact, text-first, Teams-like rows rather than oversized repeated cards. Prefer one-line descriptions with sensible wrapping and centered alignment where the current layout requires it. Do not add decorative icons to every line. Reserve icons for meaningful actions or states.

Implement loading, empty, restricted, error, stale-data and retry states. Make these distinctions explicit:

- no candidates vs failed matching;
- open cohort vs live placement;
- expired offer vs filled seat;
- paused availability vs not transition-ready.

Before accepting an offer, clearly tell the student that acceptance creates an exclusive active placement and closes incompatible open offers. The UI warning does not replace server enforcement.

## Placement supervision and completion

Implement:

- required company supervisor;
- onboarding checklist;
- competency-linked goals;
- scheduled student check-ins;
- supervisor response and structured feedback;
- evidence attachments/references and verification;
- versioned amendments to dates, stipend, location, supervisor or scope;
- private support/escalation path;
- student and supervisor completion submissions;
- operations resolution for disagreement/incomplete evidence.

Completion must emit events that idempotently update:

- roadmap competency evidence;
- portfolio evidence;
- eligible endorsements;
- pipeline relationship summary;
- placement history and analytics.

Release the active lock only through a validated completion/cancellation/termination service. Do not automatically make the student visible again; ask them to reconfirm availability.

The next eligible cohort must be scheduled or opened from the program recurrence rule without re-entering the program specification. This is a release-critical outcome, not an optional enhancement.

## Billing

For the initial release:

- finance creates or records an invoice;
- only a finance-confirmed settlement activates a dated Evergreen entitlement;
- entitlement contains program/seat limits and source reference;
- expiry, refund or suspension blocks new recruiting actions but preserves necessary access to active placements and history.

If payment adapters are currently stubs, keep them behind interfaces and do not represent a request initiation as successful payment. Automated provider activation requires signed callbacks, event deduplication, idempotent confirmation and daily reconciliation.

## Notifications

Use persistent in-app notifications and the existing supported delivery channels. Notify the correct actors for:

- program approval/change request;
- new match digest;
- invitation;
- interview schedule/change;
- offer sent and nearing expiry;
- offer accepted;
- onboarding/check-in/completion due;
- protected support escalation;
- placement completion;
- next cohort opening.

Notification delivery failure must not roll back the business action. Retry it from durable events.

## Delivery order

Implement in these phases. Keep the branch/build working at the end of each phase.

Phase 0 — safety and platform prerequisites
- close registration-role and company-membership gaps;
- implement capability policy;
- establish durable outbox/worker foundation;
- add feature flags and audit coverage.

Phase 1 — domain foundation and company program
- migrations and typed domain models;
- qualification and manual entitlement;
- program CRUD, validation, review and approval;
- company and operations program UI.

Phase 2 — student readiness, availability and matching
- readiness projection;
- availability and consent;
- cohort lifecycle;
- eligibility, explained ranking and match views.

Phase 3 — candidate pipeline, offers and lock
- applications, invitations, shortlist, interview and rejection;
- versioned formal offers;
- atomic acceptance, seat reservation and active lock;
- notifications and concurrency tests.

Phase 4 — placement workspace
- onboarding, supervisor, goals and check-ins;
- evidence, amendments, evaluations and escalations;
- reminder/recovery jobs.

Phase 5 — completion and recurrence
- completion review;
- growth-record updates;
- repeat-hire guardrail;
- lock release and availability reconfirmation;
- automatic next cohort.

Phase 6 — operations, billing and pilot hardening
- finance/entitlement workflows;
- exception and replay tools;
- funnel analytics;
- accessibility, privacy, load and recovery review;
- pilot runbook.

Do not build later-phase UI over fake persistence to appear complete. A smaller working vertical slice is preferable to disconnected screens.

## Validation and tests

At minimum, add and run:

Unit tests:
- all state-machine rules;
- qualification/entitlement policy;
- eligibility/ranking explanations;
- recurrence/date calculations;
- repeat-hire policy.

Integration tests:
- exact role/capability combinations;
- cross-company isolation;
- student consent serialization;
- offer send/accept idempotency;
- concurrent acceptance by one student;
- concurrent competition for the final seat;
- audit/outbox transactional rollback;
- worker retry/replay without duplicates.

End-to-end tests:
1. roadmap verification → availability → match → invitation → offer → acceptance → placement → completion → next cohort;
2. direct application through the same downstream pipeline;
3. offer expiry followed by another valid acceptance;
4. cancellation and authorized lock release;
5. company entitlement suspension while active placements remain accessible;
6. unauthorized and cross-company access denial;
7. invoice confirmation and entitlement expiry.

Non-functional validation:
- keyboard and screen-reader accessibility;
- candidate-list performance/pagination;
- scheduler recovery after downtime;
- absence of restricted/sensitive data in API output and logs;
- timezone recurrence boundaries;
- backup/migration verification for placement history.

Use the repository’s actual lint, type-check, test, build and migration-validation commands. Do not claim a check passed unless you ran it and observed success.

## Service verification

Before concluding:

1. Start the required services using the repository’s documented workflow.
2. Confirm database migrations apply cleanly to a development/test database.
3. Confirm backend health and critical Evergreen endpoints.
4. Confirm frontend loads and can complete the principal workflow.
5. Confirm worker processing and at least one scheduled/replayed job.
6. Report the exact commands, URLs/ports and results.

Do not alter production infrastructure or external accounts unless the user explicitly authorizes it. Local/dev service startup is expected.

## Working rules

- Inspect before editing and preserve unrelated user changes.
- Follow existing style, package boundaries and design patterns.
- Prefer domain behavior and server integrity over UI-only shortcuts.
- Do not use mock records, hard-coded users or localStorage as production state.
- Do not bypass TypeScript or validation with broad `any`, ignored errors or disabled tests.
- Do not duplicate existing infrastructure when it can be safely extended.
- Keep external providers behind adapters and make failure states honest.
- Use forward migrations; never reset or destroy user databases.
- Update API documentation, relevant READMEs and the Evergreen progress table as phases land.
- Make assumptions only when they do not change a core product decision; record meaningful assumptions in the implementation log.
- If a policy ambiguity affects money, privacy, safety, eligibility or exclusivity, stop that narrow decision, describe the safe options and continue with independent work.

## Progress tracking

Maintain an implementation checklist in `docs/zumbarl_evergreen_implementation_progress.md` with:

- phase and work item;
- status: not started / in progress / implemented / verified / blocked;
- relevant files or migration;
- tests and evidence;
- known follow-up;
- date updated.

Mark an item verified only after its server behavior, UI where applicable and required tests are complete. Keep the current baseline percentages separate from verified implementation status.

## Definition of done

No feature is done without:

- persistent typed backend state;
- server authorization and ownership;
- validated state transitions;
- idempotency for consequential retries;
- audit and durable domain events;
- usable loading/empty/error/recovery UI;
- unit/integration/end-to-end coverage appropriate to risk;
- notifications for required human action;
- operations visibility and recovery;
- no production source of truth in mocks or browser-local state.

Evergreen is end-to-end complete only when a verified company can repeatedly move qualified, consenting students through:

program → cohort → explained match → formal offer → exclusive placement → supervised completion → verified growth → next cohort

with security, finance, privacy, safety, notifications, background jobs and operations controls working throughout.

## Required final report

When work is complete—or at a meaningful requested checkpoint—report:

1. Outcome: what a user can now do end to end.
2. Phase status: implemented, verified, partial and not started.
3. Architecture changes: models, services, routes, workers and UI.
4. Migrations/backfills: what changed and how existing data was protected.
5. Security evidence: permissions and isolation tests.
6. Verification: exact lint, type-check, test, build, migration and service-health results.
7. Manual test path: company and student steps with local URLs.
8. Remaining risks or blockers, without describing unfinished work as complete.
9. Updated progress-document location.

Begin by reading the source documents and repository instructions, auditing the baseline and creating the progress checklist. Then implement Phase 0 and proceed through the phases in dependency order. Continue until the requested scope is genuinely working and verified, or until a blocker requires authority or information that cannot be discovered safely from the repository.
```

