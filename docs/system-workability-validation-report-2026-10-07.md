# Zumbarl expanded usability validation report

**Validation date:** 7 October 2026  
**Environment:** Local HTTPS frontend, local API, PostgreSQL, Redis, Safaricom sandbox, configured SMTP  
**Browsers:** Chromium/Chrome, Firefox 155, WebKit 26.6  
**Related reports:** `system-workability-audit-2026-10-07.md` and `system-workability-remediation-report-2026-10-07.md`

## Verdict

**Final code-owned gate: GO for staging and a controlled production rollout. Deployment remains conditional on external credentials, approvals, and live-provider acceptance listed below.**

The previously blocking automated accessibility and outbound-provider implementation findings are corrected. All ten representative Axe WCAG surfaces now pass with no serious or critical violations. Africa's Talking SMS and Twilio WhatsApp now make provider HTTP requests, validate E.164 recipients and approved Twilio Content SIDs, enforce timeouts, preserve provider message IDs, and distinguish provider acceptance from final delivery.

The final verification also corrected two defects found only under the expanded gate: authenticated users behind one campus/NAT address no longer share one rate-limit bucket, and business activity rows use stable event identities instead of collision-prone display text.

The remaining blockers are operational rather than hidden application passes: complete one successful handset-confirmed M-Pesa sandbox settlement, validate real SMS/WhatsApp credentials and delivery receipts in staging, supply production B2C/storage/email credentials, record legal and ODPC approval, and complete the monitoring/backup/restore rollout checklist. Automated Axe passing is not a substitute for a manual WCAG conformance audit.

The M-Pesa sandbox accepted a real STK initiation for KES 1 to the supplied test number and the application durably reconciled the final provider state. The transaction ended as `FAILED` with Safaricom result `1037 — No response from user`, so initiation, polling, failure handling, and persistence are validated, but successful payment completion is not.

## Results summary

| Validation layer | Coverage | Result |
|---|---:|---|
| Core/workability/interview gate | 33 tests | **31 passed in the combined run; the two discovered audit defects were fixed and the complete 4-role audit then passed** |
| Route/runtime/network sweep | 72 routes | **Clean after repair**; no exceptions, console errors, failed requests, 4xx/5xx responses, or document overflow |
| Core demo workflows | 17 | **17 passed** |
| Selected interaction workflows | 8 | **8 passed** |
| Responsive matrix | 15 pages × mobile/tablet | **30 passed** |
| Interview lifecycle | Student confirm → business start → conversation message | **Passed** |
| Concurrent authenticated reads | 12 simultaneous interview-list requests | **12 HTTP 200 responses in 488 ms** |
| Cross-browser smoke | 7 representative paths × 3 engines | **Passed on Chromium, Firefox, and WebKit**; WebKit local-origin allowlist corrected and retested |
| Automated WCAG scan | 10 representative surfaces | **10 passed; 0 serious or critical violations** |
| M-Pesa configuration | Sandbox OAuth/callback/STK | **Ready**; B2C credentials missing |
| M-Pesa STK execution | KES 1 sandbox request | **Accepted (HTTP 202), then failed with provider result 1037** |
| Payment/communication/config contracts | STK/B2C idempotency, callback, failure/refund, provider requests, rate-limit identity | **28 focused backend tests passed** |
| SMTP connectivity | Authenticated server handshake | **Ready**; no email sent |
| In-app communication | Interview thread and persisted notifications | **Passed** |
| SMS/WhatsApp delivery | Provider adapter contracts | **Implemented and contract-tested**; credentialed live delivery/receipts still require staging verification |
| Frontend production build | Vite | **Passed** |
| Backend build | TypeScript | **Passed** |
| Production dependency audit | Frontend and backend | **0 production vulnerabilities** |

## Interview lifecycle

The normal seed now creates an owned interview for Aisha's `Social Media Manager` application:

- The student can open the interview detail page.
- Schedule, duration, type, time zone, preparation note, and meeting link render.
- The student can RSVP and receives a persisted `confirmed` state.
- The business can start the confirmed interview.
- Starting creates or reuses an `Interview started` message and returns the conversation.
- The flow is backed by the existing student and business demo identities rather than unrelated integration-test users.

Result: **usable for the tested confirm/start handoff**. Reschedule, cancellation, meeting-room media quality, and completed-interview scoring still need separate state-transition coverage.

## Payment validation

Configuration verification returned:

- Environment: Safaricom sandbox.
- OAuth: ready.
- Public callback URL: ready.
- STK Push: configuration ready.
- B2C: credentials missing.

A disposable KES 1 opportunity was created and its mobile-money funding endpoint was called with the supplied phone number. The provider returned `Success. Request accepted for processing`, a merchant request ID, and a checkout request ID. The first immediate status query was provider-throttled with HTTP 429. After cooldown, reconciliation succeeded and persisted this final state:

```text
status: FAILED
resultCode: 1037
resultDescription: No response from user.
providerReceipt: none
```

This proves that request initiation, provider identifiers, authenticated payment reads, delayed reconciliation, provider failure mapping, and durable status storage work. It does **not** prove successful collection or callback settlement. No confirmed payment or receipt was created.

The repository/service test layer additionally passed callback idempotency, delayed callback enrichment, exactly-once escrow funding, successful B2C ledger settlement, and exactly-once failed-payout refund behavior using simulated provider responses.

## Communication validation

### Working

- Interview start created the in-app conversation message.
- Notification persistence/integration tests passed.
- SMTP authentication and connectivity verification passed.
- The email adapter contract test passed without sending to a real recipient.
- Africa's Talking SMS sends a form-encoded provider request to the sandbox or production endpoint and records the provider message ID and cost.
- Twilio WhatsApp sends approved Content templates with `ContentSid` and `ContentVariables`, Basic authentication, and provider message IDs.
- Both adapters reject invalid E.164 addresses; WhatsApp also rejects friendly template names that are not approved Twilio Content SIDs.
- An HTTP success is reported as `accepted`, not `sent` or `delivered`. Provider and transport failures return `failed`, with a `retryable` signal only for timeouts, throttling, and transient server responses.

### Not complete

- Real Africa's Talking and Twilio credentials were not supplied to this local validation, so no live recipient was contacted.
- Delivery-receipt webhook persistence, user opt-out enforcement, and durable outbox retries remain required before making SMS/WhatsApp a mandatory operational dependency.
- A live email was intentionally not sent because no recipient was supplied for this validation.
- Push delivery to a physical device was not verified.

Result: **the code-owned provider gap is fixed; outbound multichannel delivery is ready for credentialed staging, not yet live-provider signed off.**

## Accessibility validation

Automated Axe checks used WCAG 2 A/AA and WCAG 2.1 A/AA tags.

All ten surfaces passed: public home, login, student workspace, student opportunities, student profile, student interview, business workspace, business applicants, business applicant profile, and Super Admin overview.

The remediation added explicit navigation names, valid progressbar roles/value semantics, and AA-safe text/status colors across the failing shared components. Result: **the automated serious/critical WCAG gate passes.** A full conformance audit must still add manual keyboard, focus, zoom, screen-reader, cognitive, and motion checks; automated Axe coverage alone is not a formal conformance claim.

## Concurrency and browser compatibility

Twelve authenticated interview-list reads were issued simultaneously. Every request returned HTTP 200 and the group completed in 488 ms on the local environment. This validates a moderate read burst, not production load, sustained concurrency, write contention, or soak behavior.

Representative public, student, and business pages rendered without page exceptions on:

- Chrome/Chromium.
- Firefox 155.
- WebKit 26.6.

The matrix covered home, login, student workspace, opportunities, interview detail, business workspace, and applicant browsing. It is a browser-engine smoke test rather than the complete 72-route suite on every engine.

## Dependency and build validation

- Frontend and backend production dependency audits reported zero vulnerabilities.
- The frontend development toolchain reports seven transitive advisories: one low, one moderate, and five high. They affect build/test dependencies such as Babel, Browserslist, PostCSS, Nano ID, source maps, and brace expansion; they are excluded from the production dependency graph but should still be upgraded.
- Frontend unit tests passed: 10 of 10.
- Backend focused payment, communication, environment, and rate-limit tests passed: 25 of 25; the payment repository integration added 3 of 3.
- Both production builds passed.
- Backend lint and focused frontend lint passed.

## Usability decision by audience

| Audience/use | Decision |
|---|---|
| Internal team demo | **Usable** |
| Controlled pilot with visual/mouse/touch users | **Usable with monitoring** |
| Student/business core workflows | **Usable for tested paths** |
| Screen-reader or low-vision users | **Automated gate passed**; complete a manual assistive-technology audit before claiming WCAG conformance |
| Live M-Pesa collection | **Partially ready**; initiation/failure path works, successful settlement still unverified |
| SMS/WhatsApp-dependent operations | **Ready for credentialed staging**; not live-delivery signed off |
| High-concurrency production launch | **Not established** by the 12-request burst |
| General production launch | **Code gate passed; deployment is conditional** on successful M-Pesa settlement, live communication credentials/receipts, legal/ODPC approval, production infrastructure, backups, monitoring, and staging acceptance |

## New validation artifacts

- `zumbarl.com/e2e/system-workability-extended.spec.js` — interview lifecycle and concurrent authenticated reads.
- `zumbarl.com/e2e/system-workability-accessibility.spec.js` — Axe WCAG validation.
- `zumbarl.com/e2e/system-workability-cross-browser.spec.js` — representative browser-engine smoke test.
- `zumbarl.com/playwright.cross-browser.config.js` — Chromium, Firefox, and WebKit projects.
- `zumbarl_backend/src/data/seedDatabase.ts` — deterministic owned interview seed.

## Recommended next actions

1. Repeat the KES 1 sandbox STK test while actively completing the handset prompt, then verify callback/query settlement, escrow funding, and receipt display.
2. Supply staging Africa's Talking and Twilio credentials, approved Twilio Content SIDs and senders; persist signed delivery receipts and verify opt-out/durable retry behavior.
3. Complete manual accessibility testing for keyboard, focus, 200% zoom, screen readers, cognition, and reduced motion.
4. Supply production B2C, S3, SMTP, Jitsi and managed database/Redis configuration; set legal approval and the ODPC registration only after authorization.
5. Run the production deployment checklist: migrations, external `/health` and `/ready` monitors, alert routing, off-host logs, backup restore drill, rollback rehearsal, load/soak testing, and staging acceptance.
6. Add interview reschedule, cancellation, meeting-room, completion, and post-interview decision tests.
7. Upgrade the vulnerable development dependency chain without applying an unreviewed force update.
