# Zumbarl end-to-end workability and UX audit

**Audit date:** 7 October 2026  
**Environment:** Local HTTPS frontend (`https://127.0.0.1:5174`), API (`http://127.0.0.1:4100`), PostgreSQL, and Redis  
**Branch / revision:** `feature/social-first-layout` / `1ad4736`  
**Viewport coverage:** Desktop 1440×900, tablet 768×1024, mobile 390×844  
**Purpose:** Test whether the current system can be navigated and used end to end, document failures and UX friction, and make no product corrections during the audit.

## Executive result

**Release workability decision: NO-GO until the marketplace editor crash and business applicant mobile layout are addressed.**

The system has a broad working foundation. All 72 audited route entries returned a document without a 5xx response, the eight selected user-action workflows completed, and the existing core demo suite confirmed 16 of 17 scenarios. The one existing-suite failure is a stale automation locator rather than a broken user action.

One user-facing route is currently unusable: editing the persisted marketplace listing `marketplace-aisha-template-pack` crashes into the global error boundary. A second high-impact issue makes applicant-profile actions render far outside the mobile/tablet viewport. Missing persisted media, failed recommendation event calls, weak horizontal-scroll discoverability, and accessibility labelling gaps reduce trust and usability but do not stop the majority of workflows.

No application source was corrected as part of this audit. The only additions are diagnostic Playwright modules and this report.

## Coverage summary

| Audit layer | Coverage | Result |
|---|---:|---|
| Existing core demo regression | 17 scenarios | 16 passed; 1 stale test locator |
| Route and runtime audit | 72 public, student, business, and admin URLs | 71 usable; 1 blocking render crash |
| Selected action workflows | 8 workflows | 8 completed |
| Responsive reachability | 15 representative pages × 2 viewports | 30 rendered; layout/discoverability issues recorded below |
| HTTP/runtime observation | All audited routes | No document 4xx and no observed API 5xx in the route sweep |

The seeded environment contained enough persisted data for most demonstrations: 18 users, 13 students, 3 companies, 21 opportunities, 10 project workflow records, 12 marketplace listings, 5 shops, 3 knowledge spaces, 5 community groups, and 7 managed profiles. There were **zero interview records**, which prevents a realistic interview workflow test.

## Workflow and module results

Status meanings: **Pass** = observed end-to-end behavior works; **Partial** = primary surface works but a dependent path/data condition was not fully verifiable; **Fail** = user is blocked; **Not verified** = outside the safe or available local test conditions.

| Module / workflow | Designed workflow | Result | Workability and UX observation |
|---|---|---|---|
| Public access and legal | Home → login/register → help/privacy/terms/safety | Pass | Pages render and mobile controls remain reachable. The home page overflows horizontally at tablet/desktop widths because decorative content extends beyond the document. |
| Authentication and onboarding | Sign in as student/business/admin; verify protected landing; session cleanup | Pass | Existing regression confirms authentication and onboarding behavior. Role-specific routes did not fall back to login. |
| Explore Campus | Open feed → search → select announcement filter → open/cancel composer → open persisted post deep link | Pass | Search, filter, modal open/close, and a real persisted post link work. Horizontal filter tabs extend off-screen on mobile with no strong visual indication that the row can be swiped. |
| Campus copilot | Open workspace → enter a request → observe disabled/enabled CTA → receive matching content | Pass | Disabled state correctly prevents an empty request, then enables after input. The state change is functional; a short nearby hint would make the initial disabled state clearer. |
| Opportunities and bidding | Browse/filter → open opportunity → apply or return to existing bid → view tracker | Partial | Browsing and existing-bid redirect work. Several opportunity images return 404. A fresh real submission was not repeated because the seeded user already has a bid. |
| Marketing campaign participation | Open campaign → review brief → upload evidence → submit | Partial | Existing regression covers a proof-ready campaign. Direct audit confirms gated submit state. Missing campaign media exists on the business marketing surface. |
| Student project delivery | Open project → Work & Deliverables → open deliverable room → view tasks → submit/approval actions | Pass | Deliverable room and tasks work; existing regression covers submission approval and project actions. The old test expecting a button is stale because the current `Open` action is an accessible link. |
| Learning paths and resources | Open learning hub/path → assessment → guided practice → gated completion | Pass | Pages and prerequisite gating render as expected. Assessment navigation and practice finish actions are disabled until required work is completed. |
| Marketplace discovery | Browse → open listing → vendor profile → vendor workspace | Pass | Discovery, listing detail, and vendor pages render. |
| Marketplace listing management | Create listing → review readiness → edit a persisted listing | **Fail** | New-listing studio renders, but editing the persisted template pack crashes. See `W-01`. |
| Eatery and cart | Open food item → Place order → cart count becomes 1 → Clear Cart → count becomes 0 | Pass | Primary ordering/cart controls are visible and functional. Currency copy alternates between `KES` and `KSh`, which weakens consistency. |
| Checkout | Cart → delivery/payment/review → place order | Partial | Review correctly disables `Place Order` for an empty cart, but payment/review URLs can be opened directly with an empty cart and present a checkout shell instead of redirecting or clearly explaining the missing prerequisite. No real payment was executed. |
| Wellbeing | Open private area → choose mood → save daily check-in → open support/circle views | Pass with runtime warning | The check-in card and save action work. Wellbeing and support-circle page loads send a recommendation event that returns HTTP 400. |
| Messages | Open conversations → select thread → compose state | Pass | Page renders with persisted conversations. Send remains disabled until message input exists, as expected. Calls/audio delivery were not tested. |
| Student profile | Open profile → inspect panels/tabs → responsive view | Pass with mobile friction | Existing regression covers desktop/mobile profile. Several tab/metric items sit outside the initial 390 px view and rely on horizontal scrolling. |
| Business dashboard | Dashboard → recent applicant → persisted Aisha profile | Pass on desktop; **Fail UX on mobile/tablet** | Applicant name, campus, score, navigation, and profile load work. The profile layout renders controls far beyond the viewport at small widths. See `W-02`. |
| Business opportunities | List/create/review workspace → project | Pass | Core opportunity and project surfaces render; existing regression covers create/start/approve flows. |
| Business marketing | Campaign list/create/detail → proof review | Partial | Module renders, but missing local creative and an external placeholder image leave broken media. |
| Business KYC | Open KYC → submit empty form → browser validation → remain on form | Pass | Required-field validation works and preserves the form. The page repeats the same heading at H1 and H2 level, which creates avoidable navigation ambiguity for assistive technology. |
| Business settings/company/services | Open profile, services, and settings | Pass with media issue | Pages render. One persisted service asset still references an obsolete LAN URL and cannot load outside that host. |
| Evergreen student | Readiness → matches → offers → placements | Partial | Readiness and empty states work. The direct placement ID from integration data is not owned/visible to the demo student and returns a handled 404. |
| Evergreen business | Overview → program/cohort/placement workspaces | Partial | Overview routes render, but integration-test IDs are not valid records for the demo business. A complete owned seeded workflow is missing. |
| Admin / Student Care | Super Admin → switch Accounts/Finance/Gigs/Safety/Content/Analytics; open Student Care and Evergreen operations | Pass for navigation | Admin pages and module switches render. Mutation/review actions were not exercised where no pending owned records existed. Long tab strips depend on horizontal scrolling on small viewports. |
| Interviews | Invite/schedule → candidate response → conduct/complete | Not verified | Database contains zero interview records; realistic route and state-transition testing is not possible with current seed data. |

## Confirmed findings

### W-01 — Persisted marketplace listing editor crashes

- **Severity:** High / release blocker
- **Route:** `/campus/marketplace/listings/marketplace-aisha-template-pack/edit`
- **Reproduction:** Sign in as the demo student and open the edit route for the seeded template pack.
- **Expected:** Existing listing values populate the seller studio and can be reviewed or changed.
- **Actual:** Global error boundary shows `Workspace view could not load` and only `Reload view` remains available.
- **Technical evidence:** `TypeError: Cannot read properties of null (reading 'trim')` in `getStepErrors`, `src/features/opportunities/hooks/useMarketplaceListingStudio.js:147`, called from readiness calculation at lines 174 and 378.
- **UX feedback:** The recovery action only reloads the same invalid data and gives no way to return to the listing or seller workspace. Include a safe back action and a user-readable error reference even after the data-handling defect is fixed.

### W-02 — Business applicant profile actions render off-screen on mobile/tablet

- **Severity:** High for mobile business users
- **Route:** `/business/applicant-profile/cms8q498f001l66eau0ebdx55`
- **Reproduction:** Open at 390×844 or 768×1024.
- **Expected:** Header, applicant content, and actions reflow within the viewport.
- **Actual:** Header/breadcrumb regions measure to approximately 2028 px; `How it works`, `See all`, and `Show More Skills` appear far to the right. The document also has page-level horizontal overflow.
- **UX feedback:** These are important evaluation actions, so they should wrap, collapse into a clearly labelled menu, or move into a mobile action tray. Users should not need to discover a two-screen horizontal pan.

### W-03 — Persisted media references are broken or environment-specific

- **Severity:** Medium
- **Observed on:** Campus workspace, opportunity list/detail, business marketing, and business services.
- **Actual:** Multiple opportunity images return 404; marketing creative returns 404; an `example.com` campaign placeholder is blocked; at least one persisted asset still points to `https://192.168.100.19:5174/...` and cannot load in this environment.
- **UX feedback:** Broken images make genuine opportunities and campaigns look fraudulent or unfinished. Use a deliberate fallback card with asset type and owner, and validate/rewrite stored file origins during seeding or migration.

### W-04 — Recommendation event calls fail during otherwise successful page loads

- **Severity:** Medium
- **Observed:** HTTP 400 on `/campus/wellbeing` and a support-circle page; HTTP 403 while a business user opens a student applicant profile.
- **Expected:** Tracking/recommendation calls accept the correct context, or are not sent for an unsupported role/event.
- **Actual:** The main UI remains usable, but event capture fails silently in the browser console/network layer.
- **UX feedback:** This is not immediately visible to a user, but it can degrade later recommendations and analytics. It also creates noisy telemetry that can obscure real failures.

### W-05 — Mobile control strips hide later actions without enough affordance

- **Severity:** Medium UX/discoverability
- **Observed on:** Explore filters, Jobs & Gigs tabs, profile tabs, marketplace categories/sort, business navigation, project tabs, and Super Admin tabs.
- **Actual:** Controls such as `Marketplace`, `Projects & Work`, `Service Orders`, `Settings`, and later admin modules begin completely outside the initial viewport. Most strips do not cause document overflow, suggesting intentional internal scrolling, but the ability to swipe is not obvious.
- **UX feedback:** Add edge fades, a partial next item, scroll buttons, or a `More` menu. Keep the current/important action in view after navigation and ensure keyboard focus automatically scrolls the selected item into view.

### W-06 — Public home overflows horizontally at tablet/desktop widths

- **Severity:** Low to Medium
- **Observed:** Tablet overflow of about 87 px; desktop route audit also detected document-level overflow.
- **Evidence:** Decorative `community-proof-doodle` images extend past both sides of the viewport.
- **UX feedback:** Decorative artwork should be clipped inside its section and must not create a page-level horizontal scrollbar.

### W-07 — Create-post modal has an unnamed icon-only close button

- **Severity:** Medium accessibility
- **Component:** `src/features/explore/components/ExplorePostComposer.jsx`
- **Actual:** The close button contains only an `FiX` icon and has no `aria-label`; the surrounding dialog is correctly labelled `Create post`.
- **Impact:** Screen-reader users encounter an unnamed button and cannot identify its purpose confidently.
- **UX feedback:** All icon-only actions need a concise accessible name. Modal focus containment and Escape-key behavior should be included in a dedicated accessibility pass.

### W-08 — Checkout routes do not clearly guard missing prerequisites

- **Severity:** Low to Medium
- **Routes:** `/campus/cart/review`, `/campus/cart/payment`
- **Actual:** Both URLs can be opened with an empty cart. Review disables `Place Order`, while payment presents the normal checkout stage shell.
- **UX feedback:** Redirect to the empty cart or show one explicit empty-checkout state with a primary `Browse products` action. A disabled final action alone does not tell the user how to recover.

### W-09 — Existing core regression has a stale interaction contract

- **Severity:** Medium for QA confidence; not a user-facing defect
- **Test:** `e2e/core-demo.spec.js`, deliverable-room scenario near line 163.
- **Actual:** Test expects an `Open` button. The UI now exposes a link named `Open Launch Content And Performance Report`, which navigates successfully.
- **Impact:** CI can report a false regression and make genuine failures easier to ignore.
- **Recommendation:** Update the regression after product behavior is accepted, and prefer role/name locators representing the current accessible contract.

### W-10 — Seed data does not support several complete workflows

- **Severity:** Medium for acceptance-test confidence
- **Gaps:** Zero interviews; Evergreen program/cohort/placement IDs used by integration tests are not visible to the demo actors; the previous demo Connect-post ID did not exist.
- **UX/testing feedback:** Maintain one immutable, owned “happy path” record per role and workflow. Seed IDs used by browser tests should be documented and verified after each seed.

### W-11 — Currency terminology is inconsistent

- **Severity:** Low
- **Observed:** Both `KES` and `KSh` appear in related student commerce/earning surfaces.
- **UX feedback:** Choose one display convention and apply it everywhere, especially totals, payouts, cards, and receipts.

## Controls confirmed working

The following high-value controls were activated during the audit, not merely observed:

- Explore search, announcement filter, create-post modal, and cancel.
- Campus copilot disabled/enabled state and result generation.
- Project `Work & Deliverables`, deliverable-room link, and task visibility.
- Food `Place order`, cart navigation, and `Clear Cart`.
- Wellbeing mood card and `Save check-in`.
- Business dashboard applicant row and profile navigation.
- Empty Business KYC submit and native required-field validation.
- Super Admin module tabs.

Existing regression coverage additionally exercised onboarding/session cleanup, withdrawal with a mocked service, project creation/start/approval actions, campaign proof-ready state, learning path, profile layouts, creator analytics, funded opportunity state, and saved application draft behavior.

## Designed regression modules for the next test cycle

| ID | Module | Minimum happy-path workflow | Required negative/UX checks |
|---|---|---|---|
| M01 | Access and identity | Register → verify/onboard → login → role landing → logout | Invalid credentials, expired session, back-button behavior, error recovery, keyboard-only completion |
| M02 | Explore and community | Search → filter → open post → create post → comment/share | Empty results, deleted/private deep link, modal focus/Escape, media failure fallback |
| M03 | Opportunities | Browse → filter → open → apply → track → withdraw | Duplicate application, validation, unavailable listing, preserved draft, clear disabled-action explanation |
| M04 | Project delivery | Award → project → milestone → submit work → review → approve | Rejected revision, file failure, permission boundaries, unread messages, status consistency |
| M05 | Learning | Enrol → resource → assessment → practice → completion evidence | Failed assessment/retry, interrupted progress, locked-step explanation, mobile reading |
| M06 | Marketplace | Create listing → publish → edit → buy/request → fulfil → review | Null legacy fields, out-of-stock, seller permissions, delivery-code errors, broken media |
| M07 | Eatery/checkout/payment | Add meal → cart → delivery → payment → confirmation → order tracking | Empty cart guards, failed/cancelled payment, duplicate callback, stale price/stock, receipt |
| M08 | Wellbeing and care | Private check-in → support request → staff triage → student follow-up | Consent, anonymity, urgent-help boundary, role access, event-call failures, data privacy |
| M09 | Messaging/calls | Open thread → send → receive → unread state → attachment/call | Offline/reconnect, failed upload, empty send, blocked user, permission prompts |
| M10 | Business hiring | Create opportunity → publish → applicant review → shortlist/interview → award | No applicants, role restrictions, rejected KYC, schedule conflict, applicant mobile layout |
| M11 | Marketing | Create campaign → creator applies → submits proof → business review → payout | Missing creative, invalid analytics evidence, slot exhaustion, rejection/revision |
| M12 | Evergreen | Business program/cohort → match/offer → student accepts → placement → completion | Ownership, exclusivity, expired offer, exception review, billing/finance reconciliation |
| M13 | Administration | Review queues → approve/reject → audit entry → affected user sees result | Empty queues, authorization, irreversible-action confirmation, pagination, mobile tab access |

## Not verified in this pass

These areas must not be interpreted as passing:

- Real M-Pesa or other external payment execution, callbacks, refunds, and payout reconciliation.
- Email, SMS, push notifications, external object storage, or production CDN behavior.
- Interview scheduling/conduct/completion because no seeded interview exists.
- Real-time audio rooms, microphone permissions, Voice Shield transport, or multi-user calls.
- Multi-user concurrency, cross-instance realtime delivery, load, soak, failover, backup, or recovery.
- Full browser matrix (Firefox/Safari), formal WCAG audit, screen-reader pass, 200% zoom, and complete keyboard-only navigation.
- Destructive admin, finance, moderation, deletion, and irreversible lifecycle actions without dedicated disposable records.

## Test artifacts

The repeatable audit modules are:

- `zumbarl.com/e2e/system-workability-audit.spec.js` — route/runtime/network audit.
- `zumbarl.com/e2e/system-workability-actions.spec.js` — selected real interaction workflows.
- `zumbarl.com/e2e/system-workability-responsive.spec.js` — mobile/tablet reachability and overflow diagnostics.
- `zumbarl.com/e2e/core-demo.spec.js` — pre-existing core demo regression baseline.

Commands used:

```bash
npx playwright test e2e/core-demo.spec.js --reporter=list
npx playwright test e2e/system-workability-audit.spec.js --reporter=list
npx playwright test e2e/system-workability-actions.spec.js --reporter=list
npx playwright test e2e/system-workability-responsive.spec.js --reporter=line
```

Failure screenshots and traces produced by Playwright are under `zumbarl.com/test-results/`. The useful baseline locator evidence is in `core-demo-core-demo-smoke--7e79e-k-room-and-its-conversation/`; the initial action-locator diagnostics are retained in their corresponding `system-workability-actions-*` directories.

## Recommended retest order

1. Marketplace persisted-listing edit with legacy/null fields.
2. Business applicant profile at 390, 768, and 1440 px.
3. Stored media migration/fallbacks across opportunities, marketing, and services.
4. Recommendation-event role and payload handling.
5. Horizontal control discoverability and keyboard focus behavior.
6. Empty-checkout route guards and consistent currency copy.
7. Replace invalid seed references and add owned interview/Evergreen happy paths.
8. Run the complete browser, accessibility, external-service, and concurrency matrices.
