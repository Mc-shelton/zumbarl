# Zumbarl workability remediation and verification report

**Report date:** 7 October 2026  
**Environment:** Local HTTPS frontend (`https://127.0.0.1:5174`), API (`http://127.0.0.1:4100`), PostgreSQL, and Redis  
**Branch / revision:** `feature/social-first-layout` / `1ad4736` plus the uncommitted remediation work described below  
**Viewports:** Desktop 1440×900, tablet 768×1024, mobile 390×844  
**Baseline:** `docs/system-workability-audit-2026-10-07.md`

## Executive result

**Local/demo workability decision: GO for the tested surfaces. This is not yet a production-readiness sign-off.**

The second round corrected the two release-blocking findings and the reproducible runtime, network, layout, accessibility, checkout, seed-data, and consistency defects from the first audit. The final combined browser run passed **31 of 31 tests**. Its route layer opened **71 public, student, business, and admin URLs** and recorded no page exceptions, console errors, failed requests, HTTP 4xx/5xx responses, global error boundary, or document-level horizontal overflow.

The final run also passed all 17 core demo journeys, all 8 selected action workflows, and both responsive matrices. A newly seeded Evergreen happy path now gives the demo student and demo business authorized program, cohort, and placement details instead of relying on records owned by integration-test actors.

The remaining limitations are primarily coverage boundaries rather than confirmed failures: interviews still have no seed data, external payments and communications were not executed, and formal accessibility, concurrency, resilience, and cross-browser testing remain outstanding. Horizontal control rails work and do not make controls unreachable, but several would still benefit from a stronger visual scroll affordance.

## Final verification summary

| Layer | Coverage | Final result |
|---|---:|---|
| Core demo regression | 17 scenarios | **17 passed** |
| Selected user actions | 8 workflows | **8 passed** |
| Route/runtime/network sweep | 71 URLs across 4 roles | **71 rendered cleanly** |
| Responsive reachability | 15 representative pages × mobile/tablet | **30 rendered; no document overflow or unreachable controls** |
| Combined Playwright run | 31 tests | **31 passed in 4.1 minutes** |
| Frontend focused unit tests | URL normalization and cart pricing, 7 tests | **7 passed** |
| Backend recommendation schema tests | 13 tests | **13 passed** |
| Frontend production build | Vite | **Passed** |
| Backend TypeScript build | `tsc` | **Passed** |
| Focused frontend lint | Modified JS/JSX and test files | **0 errors**; CSS files were outside the ESLint config |

## Finding disposition

| ID | Original finding | Status after remediation | Verification evidence |
|---|---|---|---|
| W-01 | Persisted marketplace editor crashes on null legacy fields | **Fixed** | The edit route now renders `Edit your listing`; null strings, lists, zones, coordinates, and gallery values are normalized before validation. No page exception or error boundary occurred. |
| W-02 | Business applicant profile actions render off-screen | **Fixed** | The profile imports the business layout rules and constrains its content grid. Mobile and tablet runs reported no document overflow and no unreachable controls. |
| W-03 | Broken, private, placeholder, and obsolete-host media | **Fixed for workability** | Local private assets are rewritten to the authenticated content endpoint, old `/files` origins become same-origin paths, public assets stay public, and campaign media has a deliberate fallback. The final route sweep had no failed media requests or 4xx responses. Persisted stale URLs can still be cleaned separately as data hygiene. |
| W-04 | Recommendation events return 400/403 | **Fixed** | `wellbeing` is accepted as a recommendation surface; business viewing no longer emits the student-only profile interaction. Wellbeing, support circle, and business applicant routes produced no client errors. |
| W-05 | Horizontal control strips have weak discoverability | **Partially improved** | Responsive layout defects that made applicant controls unreachable were fixed, and intentional scroll containers are now distinguished from page overflow in the audit. Some rails still depend on swipe/scroll and would benefit from fades, arrows, or a `More` affordance. |
| W-06 | Home page has document-level horizontal overflow | **Fixed** | Decorative community artwork is clipped within its section. Desktop, tablet, and mobile checks reported no document overflow. |
| W-07 | Create-post close button has no accessible name | **Fixed** | The icon-only control now exposes `Close create post`, with the icon hidden from assistive technology. |
| W-08 | Empty payment/review routes expose an invalid checkout shell | **Fixed** | Cart loading is explicit and both routes replace-navigate to `/campus/cart` when the loaded cart is empty. The action and route suites verify the redirect. |
| W-09 | Core regression expects an obsolete `Open` button | **Fixed** | The test now targets the current accessible link contract. All 17 core scenarios pass. |
| W-10 | Seed data lacks owned Evergreen and interview workflows | **Partially fixed** | Idempotent demo program, cohort, and active placement records were added and both actors can open their details. `opportunity_interviews` still contains zero records, so the interview lifecycle remains unverified. |
| W-11 | `KES` and `KSh` are mixed | **Fixed** | User-facing commerce, offers, vendor settings, and admin vendor copy now consistently use `KES`; no `KSh` occurrence remains under `src`. |

## Corrections made

### Marketplace and stored media

- Normalized nullable persisted listing fields before form validation and draft restoration.
- Normalized gallery items in the listing editor, including legacy absolute URLs.
- Rewrote local non-public `/files/...` URLs to authenticated `/api/v1/uploads/content/...` URLs while retaining the public-assets route.
- Applied normalization to opportunity cards, bids, invites, cart items, business marketing, and other affected display paths.
- Replaced invalid marketing placeholder media and video preloads with a stable branded fallback.

### Recommendation and authorization behavior

- Added `wellbeing` to the backend recommendation surface type and validator test coverage.
- Suppressed student-only profile interaction recording when a business user views an applicant.

### Responsive and interaction behavior

- Constrained the applicant profile grid and loaded the business responsive stylesheet on that route.
- Reflowed the business applicant discovery controls at mobile widths.
- Clipped home-page decorative artwork without hiding functional content.
- Added an accessible name to the create-post close action.
- Redirected empty review/payment routes only after the cart request has completed, avoiding a premature redirect during loading.

### Demo data and test contracts

- Added an idempotent Zetech Evergreen program, active cohort, and Aisha placement to the normal database seed.
- Repointed the route audit to those actor-owned records.
- Updated the stale project-room locator to the current link name.
- Strengthened the audit to detect the global error boundary, empty-checkout behavior, and document overflow on the repaired surfaces.

## End-to-end workflow result

| Workflow | Final result | UX observation |
|---|---|---|
| Public access, identity, and policies | Pass | Public pages are reachable and responsive; home no longer creates a horizontal scrollbar. |
| Explore and posting | Pass | Search, filters, post deep link, composer open/close, and accessible close action work. Some filter rails still rely on horizontal scrolling. |
| Campus copilot | Pass | Empty input correctly disables submission; a valid prompt enables the action and returns content. |
| Opportunities and bidding | Pass for seeded path | Browse, detail, existing-bid redirect, and tracker render without broken protected images. A new duplicate bid was intentionally not submitted. |
| Marketing participation | Pass for seeded proof-ready path | Student and business campaign details render without failed placeholder/creative requests. |
| Project delivery | Pass | Student and business workspaces, task room, messages, files, activity, submission review, and approval regression paths pass. |
| Learning | Pass | Hub, learning path, resource, assessment, practice, and prerequisite gating render correctly. |
| Marketplace | Pass | Discovery, listing detail, create, persisted edit, vendor profile, and vendor workspace render. The former edit crash is resolved. |
| Eatery, cart, and checkout guards | Pass for tested path | Food can be added and cleared; empty review/payment URLs recover to cart; currency copy is consistent. Real payment remains outside this pass. |
| Wellbeing and support circle | Pass | Check-in saves and both routes load without the previous recommendation-event 400. |
| Messages | Pass for navigation/composer state | Persisted conversations load and empty-send gating works. Live delivery, attachments, and calls were not exercised. |
| Business applicant review | Pass | Dashboard-to-profile navigation works at desktop, tablet, and mobile without the prior page overflow or profile-event 403. |
| Business opportunity, marketing, KYC, services, and projects | Pass for tested paths | Pages and selected validation/actions work; media requests are clean. External verification and irreversible mutations remain out of scope. |
| Evergreen student and business | Pass for owned demo path | Overview, readiness, list, program, cohort, and placement details now use authorized seed records and render without 404s. |
| Administration and Student Care | Pass for navigation | Operational pages and Super Admin tab changes work. Empty queues and destructive actions were not forced. |
| Interviews | Not verified | There is still no seeded interview record from which to exercise invite, schedule, attend, and completion states. |

## Remaining UX and coverage work

These items should not be interpreted as failures in the tested paths, but they remain necessary before a production-readiness claim:

1. Add one owned, deterministic interview journey covering invitation, scheduling, candidate response, completion, cancellation, and permission boundaries.
2. Add clear edge fades, arrows, partial-next-item cues, or `More` menus to horizontally scrollable navigation/filter rails; ensure keyboard focus scrolls selected items into view.
3. Run a formal accessibility pass covering label association, dialogs, focus order/trapping, Escape behavior, keyboard-only use, screen readers, contrast, and 200% zoom. The audit's unnamed-control diagnostic is heuristic and does not understand every associated `<label>`.
4. Exercise real M-Pesa callbacks, failures, cancellations, duplicates, refunds, payouts, and reconciliation using a disposable test account.
5. Verify email, SMS, push, production object storage/CDN, audio/call permissions, and multi-user real-time delivery.
6. Run Firefox and Safari, plus concurrent-user, load, soak, failover, backup, and recovery tests.
7. Use dedicated disposable records for destructive admin, finance, moderation, deletion, and irreversible lifecycle testing.
8. Migrate stale persisted media origins even though the client now handles them safely, so every consumer receives canonical data.

## Reproduction commands

From `zumbarl.com`:

```bash
npx playwright test e2e/core-demo.spec.js e2e/system-workability-audit.spec.js e2e/system-workability-actions.spec.js e2e/system-workability-responsive.spec.js
npm test -- --run src/lib/normalizeZumbarlFileUrl.test.js src/features/cart/pricing.test.js
npm run build
```

From `zumbarl_backend`:

```bash
npm run db:seed
npm test -- --run src/entrypoint/validators/recommendations/recommendationSchemas.test.ts
npm run build
```

## Test artifacts

- `zumbarl.com/e2e/core-demo.spec.js` — core regression journey.
- `zumbarl.com/e2e/system-workability-audit.spec.js` — route, runtime, request, and render diagnostics.
- `zumbarl.com/e2e/system-workability-actions.spec.js` — real interaction workflows and checkout recovery.
- `zumbarl.com/e2e/system-workability-responsive.spec.js` — mobile/tablet overflow and reachability diagnostics.
- `zumbarl.com/src/lib/normalizeZumbarlFileUrl.test.js` — local/private/public URL normalization regression.

Playwright's latest screenshots, traces, and error artifacts, when generated, are stored under `zumbarl.com/test-results/`.

### Automation note

The clean combined run was executed from a fresh rate-limit window. An immediate second high-volume student route sweep reached the API limit on its final Messages page and received temporary HTTP 429 responses; the same page was clean in the combined run and the business rerun was clean. The route audit now treats console errors, failed requests, and all HTTP 4xx/5xx responses as test failures, so repeated local sweeps should be spaced or use a dedicated test rate-limit policy rather than silently accepting throttled responses.
