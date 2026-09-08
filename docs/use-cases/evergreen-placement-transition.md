# Evergreen Placement Transition

**Depends on:** [Shared setup](./shared-setup-and-test-data.md), [Career progression foundations](./career-progression-foundations.md), and [Coaching focus and recommendations](./coaching-focus-and-recommendations.md)

## EP-01 — Show a possibility before a match

1. Create an active Evergreen program matching a focus skill or competency.
2. Open an accepting cohort.
3. Leave Aisha without a candidate record.
4. Reload the coaching plan.

Expected:

- [ ] The program appears in **Career possibility map**.
- [ ] Company, placement type, work mode, and matching skills are available.
- [ ] It is labelled as a possibility, not a confirmed match or offer.
- [ ] The readiness link opens Evergreen readiness.

## EP-02 — Read readiness gaps

Open `/campus/career/evergreen/readiness`.

- [ ] Identity verification is evaluated.
- [ ] Transition access is evaluated.
- [ ] At least one verified roadmap is required.
- [ ] An active-placement lock is respected.
- [ ] Every unmet condition appears as a specific gap.
- [ ] Placement discovery cannot be enabled while blocking gaps remain.

## EP-03 — Accept sufficient in-progress evidence

1. Keep the roadmap in progress.
2. Earn an `EVIDENCE_VERIFIED` competency score at or above the program minimum.
3. Satisfy identity, transition, availability, consent, dates, work mode, and location.
4. Run matching.

Expected:

- [ ] `EVIDENCE_VERIFIED` satisfies the competency when its score meets the configured minimum.
- [ ] The student is not rejected solely because the state is not yet named `VERIFIED`.
- [ ] Every other eligibility requirement remains enforced.

## EP-04 — Reject insufficient evidence

1. Set the competency score one point below the program minimum through controlled test data.
2. Run matching.

Expected:

- [ ] The mandatory competency remains unmet.
- [ ] No eligible match is created without an authorized override.
- [ ] The explanation identifies the missing requirement.
- [ ] A level or Foundation badge cannot bypass the minimum.

## EP-05 — Verify the complete roadmap

1. Complete every required checkpoint at or above its threshold.
2. Request roadmap verification.
3. Inspect enrollment and competency states.

Expected:

- [ ] Enrollment becomes `COMPLETED`, `100%`, with verification/completion times.
- [ ] Evidenced roadmap competencies become `VERIFIED`.
- [ ] Competencies without evidence are not falsely promoted.
- [ ] Evergreen readiness returns the verified roadmap and competencies.

## EP-06 — Create an explained match

1. Enable placement availability and consent.
2. Run the Evergreen matching job.
3. Reload the coaching plan and matches page.

Expected:

- [ ] Candidate appears before general possibilities.
- [ ] Program, company, status, score, and reasons are returned.
- [ ] The link opens `/campus/career/evergreen/matches`.
- [ ] Matching does not automatically create or accept an offer.

## EP-07 — Continue through supervised placement

1. Business shortlists/interviews and sends an offer.
2. Student accepts it.
3. Complete onboarding, goals, check-ins, evidence, evaluation, and completion.

Expected:

- [ ] Only one active placement can lock the student.
- [ ] Goals and evidence are visible only to authorized participants.
- [ ] Completion releases the lock exactly once.
- [ ] Verified placement growth feeds later career evidence.
- [ ] A future recurring cohort can consider the updated student without duplicating the old placement.

## Acceptance

This feature passes when roadmap evidence drives explained placement eligibility while every trust, consent, and minimum-score boundary remains intact.
