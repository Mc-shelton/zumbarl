# Zumbarl Evergreen — End-to-End Implementation Plan and Roadmap

Status: Proposed implementation baseline  
Scope: Internships and industrial attachments  
Primary users: Students, alumni, SMEs, company pipeline teams, Zumbarl operations and finance  
Last updated: 31 August 2026

Companion execution prompt: [Zumbarl Evergreen — Master Implementation Prompt](zumbarl_evergreen_implementation_prompt.md)

## 1. Purpose

Zumbarl Evergreen is the continuous recruitment and placement loop that connects transition-ready students to recurring internship and attachment opportunities at verified SMEs.

It is more than a vacancy board. A complete Evergreen loop must:

1. prepare and verify a student;
2. establish the student's availability and preferences;
3. qualify a company and its recurring placement program;
4. open an intake automatically or manually;
5. recommend eligible candidates using verified evidence;
6. let the company interview and make a formal offer;
7. let the student accept only one active placement;
8. supervise the placement and collect evidence;
9. update the student's roadmap, portfolio and readiness record;
10. close the intake, report outcomes and open the next one.

This document turns the original concept in `apps_from_docs.md`, `ideation_notes.md`, `zumbarl_processes.md` and `ai_notes_roles.md` into a product contract and delivery sequence.

## 2. Current baseline and progress

The application already has useful foundations, but it does not yet have a usable Evergreen product.

| Capability | Current state | Estimated completion | Main gap |
|---|---|---:|---|
| Career roadmaps and evidence | Working foundation | 75% | Connect completion events to placement readiness automatically |
| Transition-ready pool | Basic backend endpoint | 35% | Availability, program filters, ranking, consent and UI |
| Company pipeline concepts and roles | Roles and partial UI concepts exist | 35% | Exact server permissions, persistent workflow and a routed workspace |
| Repeat-hire guardrail | Browser-local prototype | 20% | Server enforcement, audit history and mentorship unlock conditions |
| Placement record | Skeletal Prisma model | 20% | Relations, lifecycle, offers, locking, supervision and events |
| Evergreen programs and recurring intakes | Not implemented | 0% | Entire domain, API, scheduler and UI |
| Candidate matching and invitations | Not implemented as Evergreen | 10% | Eligibility engine, ranking, explanations and workflow |
| Formal offer and single-placement lock | Not implemented | 0% | Transactional acceptance and concurrency protection |
| Placement supervision and completion | Not implemented | 5% | Goals, check-ins, evidence, evaluations and completion workflow |
| Evergreen billing | Not implemented | 0% | Subscription/invoice/payment-confirmation lifecycle |
| Notifications and scheduled jobs | Partial general infrastructure | 20% | Durable outbox, workers, reminders, expirations and cohort scheduler |
| Evergreen operations and analytics | Not implemented | 0% | Review queues, overrides, disputes, reporting and funnel metrics |

Overall assessment:

- reusable platform foundations: approximately 40%;
- Evergreen-specific workflow: approximately 20%;
- blended end-to-end readiness: approximately 30%.

These percentages describe functional coverage, not elapsed engineering effort. The highest-risk work—permissions, state transitions, transactional locking, recurring jobs and payment confirmation—is mostly still ahead.

## 3. Product definition

### 3.1 Core product

An Evergreen program is a reusable company placement specification. It defines the roles, competencies, supervision commitments, location, duration, stipend terms, intake frequency and number of seats that the company expects to offer repeatedly.

An Evergreen cohort is one occurrence of that program. It owns dates, seats and the candidate pipeline for a particular intake.

A placement is created only after a valid offer is accepted. The accepted placement remains linked to its program, cohort, company, student and supporting evidence.

### 3.2 First-release decisions

The first production release will use these defaults:

- Support `INTERNSHIP` and `ATTACHMENT`; add graduate/full-time conversion later.
- Matching recommends candidates but never rejects a person automatically.
- A student must explicitly opt into placement discovery.
- A student can receive multiple offers but can accept only one active placement.
- The placement lock is acquired on acceptance, not when an invitation or offer is sent.
- A company must be KYC-approved and either qualify as a Pipeline Partner or receive an operations override.
- Standard qualification is three successfully completed and verified gigs plus pipeline opt-in.
- A student qualifies through transition mode, verified roadmap progress, approved identity status and active availability; operations may issue a documented override.
- Evergreen fees use a verified manual invoice in the MVP. Automated M-Pesa activation is introduced only after reliable, signed and idempotent payment callbacks exist.
- Existing projects may be linked as evidence or workspaces, but a placement has its own lifecycle and supervision records.
- University system integrations, payroll and immigration/work-permit workflows are out of the first release.

### 3.3 Product rules

1. No company can browse a transition pool before eligibility, consent and payment/plan checks pass.
2. Standard business users cannot issue formal offers.
3. Hiring Managers can manage screening but cannot issue formal offers unless their role is expanded explicitly.
4. Pipeline Partners and HR Managers can issue offers within a company they belong to.
5. Private company notes are never visible to students.
6. Matching explanations show evidence-based reasons and never expose protected or sensitive health data.
7. A call, chat or gig history cannot silently become a placement; the student must accept a formal offer.
8. A cohort cannot be marked filled until accepted placements equal its seat count.
9. An empty audio call is not “live”; similarly, an empty Evergreen cohort is open or scheduled, not active/in progress.
10. All consequential state changes are audited and emit durable domain events.

## 4. Actors and capabilities

| Actor | Primary capabilities |
|---|---|
| Student | Set availability, view explained matches, apply, respond to invitations and offers, complete onboarding, check in, submit evidence, request help |
| Transition student | All student capabilities plus access to the transition placement pool |
| Alumni | Retain eligible placement access for the configured post-graduation period |
| Company Standard | View its own projects and begin qualification; cannot browse the pool or issue formal offers |
| Pipeline Partner | Create programs, view consented candidates, manage cohorts and issue offers |
| HR Manager | Manage the complete company recruitment pipeline, private notes, offers and evaluations |
| Hiring Manager | Review candidates, shortlist and conduct interviews; no formal offer permission by default |
| Company Viewer | Read-only access to company-authorized Evergreen records |
| Company Supervisor | Manage assigned placement goals, check-ins and evaluations only |
| Operations | Review programs, grant documented overrides, resolve placement exceptions and monitor cohorts |
| Finance | Confirm invoices, refunds and fee status without accessing unnecessary student evidence |
| Platform administrator | Configure policy and manage technical operations; access remains audited |

## 5. End-to-end journey

### 5.1 Company qualification

1. Company completes KYC and organization profile.
2. System calculates pipeline eligibility from completed gigs, ratings and policy violations.
3. Company opts into the Pipeline Partner program and accepts supervision, safeguarding and data-use terms.
4. Finance confirms the Evergreen plan or operations activates a time-limited pilot entitlement.
5. System grants capabilities, records who approved them and notifies the company.

### 5.2 Program creation and approval

1. Authorized company user creates an Evergreen program.
2. Required fields include placement type, role title, duties, skills, competency level, location/mode, dates or recurrence, seats, stipend, supervision plan, learning outcomes and accessibility accommodations.
3. Validation checks minimum stipend/policy rules, realistic duration, supervisor assignment and complete attachment requirements.
4. Operations reviews the first program from a company; later programs may use risk-based review.
5. Approved program becomes active and may create cohorts.

### 5.3 Cohort opening

1. A company opens a cohort manually or a scheduler creates it from a recurrence rule.
2. The cohort starts in `SCHEDULED` and becomes `OPEN` at its configured time.
3. The system calculates eligible students and creates versioned match records.
4. Students may be invited by the company, apply directly, or do both without duplicate candidature.
5. Seat counts and dates are visible to authorized users.

### 5.4 Student readiness and discovery

1. Roadmap completion or another verified trigger evaluates transition readiness.
2. Student reviews a readiness summary and explicitly enables “Seeking an attachment/internship.”
3. Student supplies placement type, dates, location, remote preference, role interests and any optional accommodation preferences.
4. Student consents to the fields that qualified businesses may see.
5. Matching jobs create recommendations with concise, inspectable reasons.

### 5.5 Candidate pipeline

1. Company views only candidates matched to its active cohort or applicants to it.
2. Company can invite, shortlist, reject with a structured reason, request an interview and record private notes.
3. Student can accept or decline an invitation and withdraw before accepting an offer.
4. All candidate state changes are authorized, validated and audited on the server.
5. Rejection reasons feed aggregate program quality analysis but do not automatically penalize students.

### 5.6 Formal offer and placement lock

1. Authorized HR or Pipeline Partner user prepares an offer with role, dates, supervisor, stipend, location, expectations, response deadline and policy links.
2. Student accepts, declines or asks a question.
3. Acceptance runs in one database transaction:
   - lock the student’s placement-availability row;
   - confirm the offer is open and unexpired;
   - confirm the cohort has a seat;
   - confirm no active placement lock exists;
   - create the placement;
   - acquire the active placement lock;
   - reserve the cohort seat;
   - mark the offer accepted;
   - expire other open offers according to policy;
   - create an audit entry and outbox event.
4. If two accept requests race, only one can commit.
5. A released or cancelled placement requires an authorized reason and preserves history.

### 5.7 Placement execution

1. Student and supervisor complete an onboarding checklist before the start date.
2. Placement defines goals and expected evidence aligned to roadmap competencies.
3. Student submits scheduled check-ins; supervisor acknowledges them and records feedback.
4. Either party can raise a support request or safeguarding concern through the correct private channel.
5. Missed check-ins create reminders and then an operations escalation—not an automatic termination.
6. Material changes to dates, stipend, supervisor or scope require a recorded amendment.

### 5.8 Completion and renewal

1. Student submits final evidence and reflection.
2. Supervisor submits a structured evaluation and verifies eligible evidence.
3. Operations handles disagreements or incomplete records.
4. Completion updates roadmap evidence, portfolio, endorsements and transition history through domain events.
5. Platform releases the active lock and marks the student available only if the student has opted to remain available.
6. Company sees completion and conversion metrics.
7. Scheduler creates or opens the next cohort when recurrence and entitlement rules permit.

This final step makes Evergreen continuous; without it, the feature is only a one-time placement pipeline.

## 6. State machines

State transitions must be implemented in domain services. Controllers and clients may request transitions but must not set status fields directly.

### 6.1 Evergreen program

`DRAFT -> PENDING_REVIEW -> ACTIVE -> PAUSED -> ARCHIVED`

Additional transitions:

- `PENDING_REVIEW -> CHANGES_REQUESTED -> PENDING_REVIEW`
- `ACTIVE -> SUSPENDED` by operations for policy or payment issues
- `SUSPENDED -> ACTIVE` after resolution

Only an active program with a valid entitlement may open a cohort.

### 6.2 Cohort

`SCHEDULED -> OPEN -> MATCHING -> INTERVIEWING -> FILLED | PARTIALLY_FILLED -> IN_PROGRESS -> COMPLETED`

Exceptional states: `CANCELLED`, `PAUSED`.

“Live” should mean at least one accepted, started placement exists. An open cohort with zero accepted candidates is not live.

### 6.3 Candidate

`MATCHED -> INVITED | APPLIED -> SHORTLISTED -> INTERVIEWING -> OFFERED -> ACCEPTED -> STARTED -> COMPLETED`

Terminal or alternate states: `DECLINED`, `WITHDRAWN`, `REJECTED`, `OFFER_EXPIRED`, `TERMINATED`.

A student/cohort pair has only one candidate record regardless of whether the journey began through a match, invitation or application.

### 6.4 Offer

`DRAFT -> SENT -> VIEWED -> ACCEPTED | DECLINED | EXPIRED | WITHDRAWN`

An accepted offer is immutable. Corrections require a versioned amendment or replacement offer.

### 6.5 Placement

`PENDING_ONBOARDING -> READY -> ACTIVE -> COMPLETION_REVIEW -> COMPLETED`

Exceptional states: `DEFERRED`, `CANCELLED_BEFORE_START`, `TERMINATED`, `DISPUTED`.

The active placement lock applies from accepted offer through completion or authorized release.

## 7. Data architecture

Use typed Prisma models for the core workflow. Do not store primary Evergreen state in a generic workflow JSON record.

### 7.1 New primary models

#### `EvergreenProgram`

Key fields:

- `id`, `companyId`, `createdById`, `approvedById`;
- `title`, `description`, `placementType`;
- `workMode`, `location`, `durationWeeks`;
- `defaultSeatCount`, `stipendAmount`, `currency`, `stipendFrequency`;
- `supervisionPlan`, `learningOutcomes`;
- `recurrenceType`, `recurrenceRule`, `timezone`;
- `status`, `riskLevel`, `approvedAt`, timestamps and version.

Relations: required skills, competencies, supervisors, cohorts, subscription and audit events.

#### `EvergreenCohort`

Key fields:

- `id`, `programId`, `sequenceNumber`;
- application, interview, offer and placement date ranges;
- `seatCount`, `reservedSeats`, `filledSeats`;
- `status`, `openedAt`, `closedAt`;
- recurrence source and timestamps.

Constraints:

- unique `(programId, sequenceNumber)`;
- date order checks;
- non-negative seat counters;
- no overbooking.

#### `EvergreenCandidate`

Key fields:

- `id`, `cohortId`, `studentId`;
- `source` (`MATCH`, `APPLICATION`, `INVITATION`, `OPERATIONS`);
- `status`, `matchScore`, `matchVersion`;
- structured `matchReasons` and eligibility snapshot;
- consent snapshot, timestamps and last actor.

Constraint: unique `(cohortId, studentId)`.

#### `PlacementAvailability`

Key fields:

- `studentId` unique;
- `isSeeking`, placement types, earliest/latest dates;
- locations, work modes, role interests;
- weekly availability and consent version;
- `visibleFrom`, `pausedAt`, `expiresAt`.

Availability expires periodically and must be reconfirmed.

#### `PlacementOffer`

Key fields:

- `id`, `candidateId`, `companyId`, `studentId`, `createdById`;
- version, role, terms, stipend, dates, supervisor;
- `status`, `sentAt`, `viewedAt`, `respondBy`, response timestamps;
- withdrawal/decline reason and replacement-offer link.

#### `ActivePlacementLock`

This table contains only active locks:

- `studentId` unique;
- `placementId` unique;
- `acquiredAt`, `acquiredFromOfferId`.

The row is created in the offer-acceptance transaction and deleted only through an authorized release service. Placement status history and audit logs preserve the historical lock record.

#### Supervision and outcome models

- `PlacementGoal`: expected outcome, linked competency, due date and status.
- `PlacementCheckIn`: reporting period, student reflection, supervisor response and risk flag.
- `PlacementEvidence`: artifact reference, evidence type, verification state and roadmap linkage.
- `PlacementEvaluation`: evaluator, rubric scores, narrative, recommendation and visibility.
- `PlacementAmendment`: versioned changes accepted by required parties.
- `PlacementStatusEvent`: append-only transition history.

#### Entitlement and operations models

- `EvergreenEntitlement`: company, plan, status, seat/program limits, valid dates and source.
- `EvergreenInvoice`: amount, currency, status and external reference.
- `EvergreenOverride`: subject, policy, reason, approver and expiry.
- `EvergreenMatchRun`: matching version, inputs, start/end state and aggregate counts.
- `OutboxEvent`: durable domain event pending delivery to workers.

### 7.2 Extend existing models

Extend `Placement` rather than creating a competing placement table:

- add an explicit `student` relation;
- link `programId`, `cohortId`, `candidateId`, `offerId` and `supervisorId`;
- add lifecycle status, work mode, location, onboarding dates and termination fields;
- retain type, salary/stipend and platform fee fields where semantically correct;
- replace ambiguous `isLocked` as the source of truth with `ActivePlacementLock`;
- add appropriate compound indexes for company, student, cohort and status queries.

Reuse `PipelineRelationship` as the long-lived student/company relationship summary, not as the candidate pipeline itself. Update it from placement and gig events.

### 7.3 Data integrity

- Foreign keys and restrictive deletes protect placement history.
- Money is stored as fixed decimal plus ISO currency.
- All date-time fields are UTC; program recurrence retains an IANA timezone.
- Mutable records use optimistic version fields where concurrent editing is plausible.
- Personally sensitive fields use allow-listed serializers and retention rules.
- Audit and outbox records are append-only to application users.

## 8. Backend module and API

Create a dedicated backend module following the existing route → controller → service → repository separation:

```text
src/modules/evergreen/
  evergreen.routes
  evergreen.controller
  evergreen.validators
  evergreen.service
  evergreen.repository
  evergreen.permissions
  evergreen.events
  evergreen.jobs
  matching/
  offers/
  placements/
```

Suggested API surface under `/api/v1/evergreen`:

### 8.1 Company endpoints

- `GET /eligibility`
- `POST /programs`
- `GET /programs`
- `GET /programs/:programId`
- `PATCH /programs/:programId`
- `POST /programs/:programId/submit`
- `POST /programs/:programId/pause`
- `POST /programs/:programId/cohorts`
- `GET /cohorts/:cohortId/candidates`
- `POST /cohorts/:cohortId/invitations`
- `POST /candidates/:candidateId/shortlist`
- `POST /candidates/:candidateId/interviews`
- `POST /candidates/:candidateId/reject`
- `POST /candidates/:candidateId/offers`
- `POST /offers/:offerId/send`
- `POST /offers/:offerId/withdraw`
- `GET /placements/:placementId`
- `POST /placements/:placementId/goals`
- `POST /placements/:placementId/check-ins/:checkInId/respond`
- `POST /placements/:placementId/evaluations`
- `POST /placements/:placementId/complete`

### 8.2 Student endpoints

- `GET /student/readiness`
- `PUT /student/availability`
- `POST /student/availability/pause`
- `GET /student/matches`
- `POST /cohorts/:cohortId/applications`
- `POST /invitations/:candidateId/respond`
- `GET /student/offers`
- `POST /offers/:offerId/accept`
- `POST /offers/:offerId/decline`
- `GET /student/placements`
- `POST /placements/:placementId/onboarding`
- `POST /placements/:placementId/check-ins`
- `POST /placements/:placementId/evidence`
- `POST /placements/:placementId/completion`

### 8.3 Operations and finance endpoints

- `GET /admin/program-reviews`
- `POST /admin/programs/:programId/approve`
- `POST /admin/programs/:programId/request-changes`
- `POST /admin/overrides`
- `GET /admin/placement-alerts`
- `POST /admin/placements/:placementId/resolve`
- `POST /admin/entitlements`
- `POST /finance/invoices/:invoiceId/confirm`
- `POST /finance/invoices/:invoiceId/refund`

### 8.4 API requirements

- Apply exact capability checks in addition to broad role groups.
- Verify company membership and record ownership on every company resource.
- Use idempotency keys for offer send/accept, payment confirmation, cohort creation and completion.
- Return transition conflicts as `409` with a stable error code.
- Use cursor pagination for candidates, matches and placement history.
- Expose allowed actions derived by the server; do not make the UI reconstruct policy.
- Validate all state transitions through a shared transition service.

## 9. Matching and readiness engine

### 9.1 Hard eligibility filters

A candidate is eligible only when all required checks pass:

- approved student identity/KYC state;
- transition access or documented override;
- active, unexpired placement availability and consent;
- placement type and date compatibility;
- location/work-mode compatibility;
- required mandatory competencies or prerequisites;
- no active placement lock;
- no disqualifying company/student conflict or safeguarding restriction;
- cohort is open and has capacity for consideration.

### 9.2 Ranking inputs

Eligible candidates may be ranked by:

- verified competency and skill coverage;
- relevant portfolio and project evidence;
- roadmap stage and evidence freshness;
- stated interests and schedule fit;
- prior positive, policy-compliant company relationship;
- verified endorsements;
- interview readiness and response reliability where fairly measured.

Do not use health-circle participation, sensitive wellbeing activity, ethnicity, gender, disability disclosure or financial distress as ranking inputs.

### 9.3 Explainability and governance

- Store the matching algorithm version and an input snapshot.
- Show students and companies concise reasons such as “3 of 4 verified competencies” or “dates and remote preference align.”
- Treat the score as decision support, not an eligibility verdict.
- Give operations a match-run summary and anomaly indicators.
- Monitor selection, offer and completion rates for unexplained group disparities using legally and ethically appropriate aggregate data.

## 10. Events, workers and automation

### 10.1 Domain events

Minimum events:

- `roadmap.verified`
- `student.transition_enabled`
- `student.placement_availability_changed`
- `company.pipeline_qualified`
- `evergreen.program_activated`
- `evergreen.cohort_opened`
- `evergreen.match_completed`
- `evergreen.candidate_status_changed`
- `evergreen.offer_sent`
- `evergreen.offer_accepted`
- `placement.started`
- `placement.check_in_overdue`
- `placement.completed`
- `placement.lock_released`
- `evergreen.cohort_completed`

Write business changes and their outbox events in the same database transaction. Workers deliver side effects with idempotent consumers.

### 10.2 Scheduled jobs

| Job | Suggested frequency | Purpose |
|---|---|---|
| Cohort scheduler | Hourly | Create/open/close cohorts from recurrence rules |
| Match dispatcher | Event driven plus nightly recovery | Match newly ready students and changed cohorts |
| Offer expiry | Every 15 minutes | Expire overdue offers and release unaccepted reservations |
| Availability expiry | Daily | Ask students to reconfirm old availability |
| Placement reminders | Daily | Onboarding, start, check-in and completion reminders |
| Placement state reconciler | Daily | Detect inconsistent lock, seat and status records |
| Entitlement reconciler | Daily | Pause restricted actions after plan expiry or refund |
| Next-cohort planner | Daily | Prepare the next eligible recurring intake |

Every job needs a distributed lock, retry policy, dead-letter visibility and a manual replay mechanism.

## 11. Frontend experience

### 11.1 Company routes

```text
/business/evergreen
/business/evergreen/programs/new
/business/evergreen/programs/:programId
/business/evergreen/cohorts/:cohortId
/business/evergreen/candidates/:candidateId
/business/evergreen/offers/:offerId
/business/evergreen/placements/:placementId
```

The existing Pipeline navigation item should route to `/business/evergreen` once the workspace is available.

Core views:

- qualification and plan status;
- program list and guided creation;
- cohort summary with seats and dates;
- compact Teams-like candidate activity feed rather than large repeated cards;
- candidate comparison and evidence drawer;
- interview and offer composer;
- active placement roster;
- supervision timeline and outcome dashboard.

Use one-line, text-first event rows with centered, wrapping content where space is constrained. Icons should be reserved for actions or status that cannot be communicated clearly in words.

### 11.2 Student routes

```text
/campus/career/evergreen
/campus/career/evergreen/readiness
/campus/career/evergreen/matches
/campus/career/evergreen/offers/:offerId
/campus/career/evergreen/placements/:placementId
```

Core views:

- readiness checklist and evidence gaps;
- availability and privacy controls;
- explained matches;
- invitation/application status timeline;
- offer comparison and acceptance warning;
- onboarding and placement workspace;
- check-ins, evidence and completion summary.

Before acceptance, the UI must explain that accepting creates an exclusive active placement and closes other open offers. The server remains the authority.

### 11.3 Operations and finance routes

```text
/admin/evergreen/reviews
/admin/evergreen/cohorts
/admin/evergreen/placements
/admin/evergreen/exceptions
/admin/evergreen/billing
```

Operations needs review aging, missing supervisors, unfilled cohorts, overdue check-ins, disputed completions and expiring entitlements. Finance needs only billing-relevant data.

### 11.4 Required UI states

Every page must implement loading, empty, restricted, error, stale-data and retry states. In particular:

- “No candidates yet” is distinct from a failed match run.
- “Open cohort” is distinct from “Live placement.”
- “Offer expired” is distinct from “Seat filled.”
- “Availability paused” is distinct from “Not transition-ready.”

## 12. Security, privacy and safety prerequisites

Evergreen must not ship on client-only permissions.

Required before pilot:

1. Remove internal/platform roles from public registration inputs and enforce a server-owned role allow-list.
2. Make company registration create and verify the required company membership relation.
3. Add capability middleware for formal offers, pool access, program approval, finance actions and placement supervision.
4. Test cross-company isolation for every program, candidate, offer and placement endpoint.
5. Separate private HR notes, shared evaluation content and student-visible feedback.
6. Record consent version and the exact candidate fields disclosed to a company.
7. Exclude wellbeing and safety-domain data from matching and company views.
8. Add rate limits and enumeration-resistant identifiers to candidate and offer endpoints.
9. Audit administrative reads and overrides, not only writes.
10. Define retention and deletion rules that preserve legally required placement records without retaining unnecessary application data.

## 13. Billing approach

### MVP

- Operations or finance creates an invoice.
- Finance confirms settled payment using an external reference.
- Confirmation activates a dated entitlement with explicit limits.
- Refund, expiry or suspension prevents new programs/cohorts while preserving active placements and history.

### Production automation

- Create payment request in `PENDING` state.
- Accept signed provider callback.
- Deduplicate by provider event/reference.
- Mark `CONFIRMED` only after provider confirmation.
- Activate entitlement in the same transaction as payment confirmation/outbox creation.
- Reconcile provider records daily.

The current payment-adapter stubs are not sufficient for automatic Evergreen activation.

## 14. Notification plan

| Event | Student | Company | Operations |
|---|---|---|---|
| Program approved | — | In-app/email | Audit only |
| New explained match | In-app/email digest | — | Aggregate metrics |
| Invitation | In-app/email | Confirmation | — |
| Interview scheduled/changed | In-app/email | In-app/email | — |
| Offer sent | In-app/email, optional SMS | Confirmation | — |
| Offer nearing expiry | In-app/email | In-app | — |
| Offer accepted | Confirmation | Immediate notice | Audit/exception feed |
| Onboarding/check-in due | In-app/email | Assigned supervisor | Escalation after grace period |
| Support concern | Acknowledgment | Only when safe/appropriate | Immediate protected queue |
| Placement completed | Outcome summary | Outcome summary | Completion audit |
| Next cohort opened | Eligible student digest | Company summary | Monitoring |

Notification preferences apply except to essential transactional and safety notices. Delivery failure must not roll back the underlying state transition.

## 15. Delivery roadmap

The estimates below are engineering sprints, not calendar promises. A sprint assumes a cross-functional product team with backend, frontend, design/QA access and timely policy decisions.

### Phase 0 — Safety and platform prerequisites (1 sprint)

Deliverables:

- close public role-assignment and company-membership gaps;
- define Evergreen capabilities and exact role matrix;
- introduce outbox/worker foundation and job observability;
- approve state machines, terms, supervision and data-sharing policy;
- add feature flags and pilot-company configuration.

Exit gate: security tests prove no public role escalation or cross-company data access.

### Phase 1 — Domain foundation and company program (1–2 sprints)

Deliverables:

- Prisma models and safe migrations;
- Evergreen backend module and transition services;
- company eligibility and entitlement checks;
- program CRUD, validation, submission and operations approval;
- company program workspace and operations review UI;
- audit events and API contract tests.

Exit gate: an approved company can activate a valid recurring program, but no student data is exposed yet.

### Phase 2 — Student readiness, availability and matching (2 sprints)

Deliverables:

- readiness evaluation from verified roadmap evidence;
- student availability and consent controls;
- cohort creation/opening;
- eligibility filters, versioned ranking and match explanations;
- student match UI and company consented candidate list;
- matching audit, recovery and fairness metrics.

Exit gate: an eligible student appears only in appropriate company cohorts with an understandable reason and correct privacy boundary.

### Phase 3 — Candidate pipeline, offers and exclusive lock (2 sprints)

Deliverables:

- invitations, applications, shortlist, interview and rejection states;
- exact company role capabilities;
- versioned formal offers;
- atomic acceptance, seat reservation and active-placement lock;
- conflict handling, other-offer expiry and release workflow;
- full company/student pipeline UI and notifications.

Exit gate: concurrency tests prove a student cannot accept two placements and a cohort cannot overfill.

This completes the first useful recruitment-loop MVP.

### Phase 4 — Placement workspace and supervision (2 sprints)

Deliverables:

- onboarding checklist and supervisor assignment;
- goals, recurring check-ins, evidence and amendments;
- help/escalation workflow;
- supervisor and student evaluations;
- reminder and exception jobs;
- compact activity timeline on company and student views.

Exit gate: a pilot placement can run from accepted offer through completion review without off-platform spreadsheets.

### Phase 5 — Completion, growth engine and recurrence (2 sprints)

Deliverables:

- verified completion workflow;
- roadmap, portfolio, endorsement and pipeline-relationship updates through events;
- lock release and availability reconfirmation;
- repeat-hire guardrail enforced on the server;
- mentorship alternatives such as office tour, shadowing and structured performance advice;
- automatic next-cohort creation/opening and renewal notifications.

Exit gate: completing one cohort updates student growth records and produces the next eligible cohort without manual data re-entry.

This phase completes the true continuous Evergreen loop.

### Phase 6 — Billing, operations hardening and controlled pilot (1–2 sprints)

Deliverables:

- manual-invoice entitlement workflow and finance UI;
- reconciliation and entitlement-expiry jobs;
- operations dashboards, overrides, disputes and replay tools;
- analytics funnel and service-level alerts;
- load, accessibility, privacy and recovery testing;
- pilot runbook and support ownership.

Exit gate: finance, operations and support can safely operate the feature for a controlled pilot.

### Phase 7 — General availability and optimization (ongoing)

Possible increments:

- verified M-Pesa billing automation;
- better matching through measured, explainable signals;
- institution placement-office workflows;
- graduate/full-time conversion offers;
- stipend disbursement/escrow where legally and operationally appropriate;
- capacity forecasting and company renewal recommendations;
- integrations with calendars, HR systems and learning providers.

## 16. Recommended release slices

### Internal alpha

- One manually entitled company.
- One program and one manually opened cohort.
- Operations-curated students.
- Formal offer and transactional lock.
- Manual support and audit inspection.

Purpose: validate the state machine and permissions before automated matching.

### Closed pilot

- Several verified SMEs.
- Student availability and explained matching.
- Full pipeline and supervised placement workspace.
- Manual invoices and automated reminders.
- Next-cohort automation behind a feature flag.

Purpose: validate time-to-fill, supervision burden, acceptance and completion.

### General availability

- Self-service program submission with review controls.
- Stable scheduler and worker recovery.
- Production billing confirmation.
- Operations SLAs, analytics, privacy review and incident runbook.

## 17. Sequenced implementation backlog

### E0 — Prerequisites

- E0.1 Public-registration role allow-list.
- E0.2 Company membership creation and ownership middleware.
- E0.3 Capability policy map and tests.
- E0.4 Durable outbox, worker runner and job observability.
- E0.5 Feature flags and audit-read support.

### E1 — Program and entitlement

- E1.1 Evergreen schema and migrations.
- E1.2 Company qualification calculation.
- E1.3 Manual entitlement lifecycle.
- E1.4 Program CRUD and validation.
- E1.5 Program review and approval.
- E1.6 Company and operations screens.

### E2 — Cohort and matching

- E2.1 Cohort lifecycle and seat invariants.
- E2.2 Availability and consent.
- E2.3 Transition-readiness listener.
- E2.4 Eligibility and matching v1.
- E2.5 Match explanations and pool privacy.
- E2.6 Match UI and recovery jobs.

### E3 — Recruitment and offer

- E3.1 Candidate state machine.
- E3.2 Invitation and application flow.
- E3.3 Shortlist/interview/rejection flow.
- E3.4 Offer creation and authorization.
- E3.5 Atomic acceptance and active lock.
- E3.6 Offer expiry, notifications and race tests.

### E4 — Placement delivery

- E4.1 Onboarding and supervisor access.
- E4.2 Goals and check-ins.
- E4.3 Evidence and amendments.
- E4.4 Alerts and protected support path.
- E4.5 Evaluation and completion review.

### E5 — Continuity and growth

- E5.1 Completion domain events.
- E5.2 Roadmap/portfolio/endorsement updates.
- E5.3 Repeat-hire guardrail and mentorship alternatives.
- E5.4 Lock release and student availability reconfirmation.
- E5.5 Recurrence scheduler and next-cohort workflow.
- E5.6 Outcome analytics.

### E6 — Production operations

- E6.1 Billing reconciliation.
- E6.2 Exception and dispute console.
- E6.3 Job replay and dead-letter tooling.
- E6.4 Privacy/accessibility/load review.
- E6.5 Pilot migration, runbook and support training.

## 18. Test strategy

### Unit tests

- every allowed and forbidden state transition;
- qualification and entitlement policy;
- hard eligibility and ranking explanations;
- recurrence/date calculations;
- seat and lock invariant helpers;
- repeat-hire guardrail.

### Repository and integration tests

- company ownership and role-capability combinations;
- consented field serialization;
- idempotent offer send/accept and payment confirmation;
- two simultaneous accept requests for one student;
- simultaneous final-seat acceptance by two students;
- transaction rollback when audit/outbox creation fails;
- job retry and replay without duplicate records.

### End-to-end tests

1. Roadmap verification → availability → match → invitation → offer → acceptance → placement → completion → next cohort.
2. Direct student application through the same downstream workflow.
3. Offer expiry and successful acceptance of another offer.
4. Placement cancellation, authorized lock release and re-entry into matching.
5. Company suspension while active placements remain safely accessible.
6. Cross-company and unauthorized-role access denial.
7. Manual invoice confirmation and entitlement expiry.

### Non-functional tests

- keyboard and screen-reader accessibility;
- candidate-list pagination and load performance;
- scheduler recovery after downtime;
- privacy logging and sensitive-field absence;
- backup/restore of offer and placement history;
- timezone boundaries and daylight-saving recurrence where applicable.

## 19. Analytics and success measures

Track a funnel by cohort and company:

- eligible students;
- matched students;
- invitations and applications;
- shortlist and interview rates;
- offers sent, accepted, declined and expired;
- time to first qualified candidate and time to fill;
- seat fill rate;
- onboarding completion;
- placement retention and completion;
- verified skills/evidence gained;
- internship/attachment-to-paid-work conversion;
- repeat program and next-cohort activation;
- student and supervisor satisfaction;
- support incidents and resolution time.

North-star outcome: completed, supervised placements that produce verified student growth and cause qualified companies to open another cohort.

Do not optimize only for applications or raw match volume.

## 20. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Two placements accepted concurrently | Unique active lock plus transactional student/seat locking and race tests |
| Company sees unauthorized candidates | Server capabilities, company ownership, student consent and allow-listed responses |
| Matching amplifies bias | Hard/soft signal separation, explainability, human decisions and aggregate fairness review |
| Program promises poor supervision | Required supervisor and learning plan, first-program review, check-ins and suspension policy |
| Empty or stale availability creates noise | Availability expiry and periodic reconfirmation |
| Scheduler duplicates cohorts | Unique program/sequence key, idempotency and distributed job lock |
| Payment appears successful prematurely | Confirm only from trusted callback/manual finance verification and reconcile daily |
| Completion evidence does not update learning | Transactional outbox, idempotent growth consumers and replay tooling |
| Active placement loses access after plan expiry | Entitlement limits new recruiting actions but preserves required active-placement access |
| Repeat hiring becomes cheap labor | Server guardrail after configured repeat count, with documented mentorship alternatives and operations review |
| Operational burden grows silently | Exception dashboards, SLA metrics, pilot caps and explicit support ownership |

## 21. Definition of done

An Evergreen capability is not complete until it has:

- persistent backend state with typed relations;
- server-enforced authorization and ownership;
- validated state transitions and stable error codes;
- idempotency for retryable consequential actions;
- audit and durable domain events;
- loading, empty, failure and recovery UI states;
- unit, integration and representative end-to-end tests;
- notifications where a user must act;
- operations visibility and a recovery path;
- no mock data or browser-local state serving as the source of truth.

Evergreen as a whole is complete when a verified company can repeatedly move qualified students through program → cohort → match → offer → locked placement → supervised completion → verified growth → next cohort, with finance, privacy, safety and operations controls working throughout.

## 22. Immediate next actions

1. Approve the first-release decisions in section 3.2.
2. Turn Phase 0 into assigned security and platform tickets.
3. Draft the Prisma migration for programs, cohorts, candidates, offers, availability, locks and supervision records.
4. Define the exact capability matrix as code and API contract tests.
5. Prototype the company program form and student availability flow against the proposed API shapes.
6. Build the offer-acceptance transaction and concurrency test early; it is the critical integrity boundary.
7. Select one pilot SME and a small consented student group before enabling recurring automation.
