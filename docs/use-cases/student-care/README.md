# Student Care End-to-End Use Cases

This suite verifies that Zumbarl connects self-guided wellbeing support, human care coordination, support circles, events and non-clinical recovery pathways without turning sensitive information into public activity or career scoring.

## Product journey

```text
Private check-in or Talk It Out
              ↓
Self-help, human request, counselor, circle, or structured pathway
              ↓
Restricted Student Affairs review and ownership
              ↓
Sessions, referrals and private progress check-ins
              ↓
Follow-up, aftercare, completion, pause, or withdrawal
```

## Execution order

1. [Setup, actors and safety boundaries](./00-setup-and-safety-boundaries.md)
2. [Private check-ins and guided next steps](./01-private-checkins-and-guidance.md)
3. [Human support and crisis handoff](./02-human-support-and-crisis-handoff.md)
4. [Care-program enrollment and progress](./03-care-program-enrollment-and-progress.md)
5. [Support circles, sessions and events](./04-support-circles-and-events.md)
6. [Student Affairs operations](./05-student-affairs-operations.md)
7. [Recovery navigation and aftercare](./06-recovery-and-aftercare.md)
8. [Privacy, accessibility and regression](./07-privacy-accessibility-and-regression.md)

## Acceptance rule

The suite does not pass because cards or reassuring text are visible. Requests must reach the restricted queue, staff updates must return to the student, urgent language must never pretend emergency services were contacted, setbacks must remain non-punitive, and sensitive care activity must remain absent from public profiles, feeds, search, recommendations and career scores.

| Area | Result |
| --- | --- |
| Private check-in and self-guided support | PASS / FAIL |
| Explicit human handoff | PASS / FAIL |
| Counselor coordination | PASS / FAIL |
| Structured care pathways | PASS / FAIL |
| Support circles and events | PASS / FAIL |
| Student Affairs operations | PASS / FAIL |
| Recovery referral and aftercare | PASS / FAIL |
| Privacy, access and non-punitive behavior | PASS / FAIL |

Overall acceptance requires every row to pass.
