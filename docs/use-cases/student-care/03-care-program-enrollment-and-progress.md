# Care-program Enrollment and Progress

## SC-CP-01 — Compare available pathways

1. Open the **Structured support** section.
2. Review all three seeded pathways.

Expected:

- each explains its coordinator, purpose, duration and steps;
- recovery clearly states that licensed treatment is outside Zumbarl;
- every card says participation is absent from profile and score.

## SC-CP-02 — Enroll with a goal and explicit consent

1. Open **Steady Under Pressure**.
2. Enter a private goal but do not consent.
3. Attempt to submit, then consent and submit.

Expected:

- submission is blocked without consent at both UI and API levels;
- one enrollment and one linked program-request case are created atomically;
- duplicate active enrollment is rejected;
- the card changes to an enrolled state.

## SC-CP-03 — Staff accepts the plan

1. Open the enrollment in Student Care Operations.
2. Choose **Accept plan** and add a student-visible next step.
3. Reload the student page.

Expected:

- enrollment changes from requested to active;
- the linked support request moves to in review;
- the student sees the next-step note;
- a support-update timeline record identifies the acting operator.

## SC-CP-04 — Student records progress

1. Submit **I completed a step**.
2. Reload and inspect the progress indicator.

Expected:

- current step advances exactly once;
- the check-in is stored as student-visible progress;
- no career XP, score, public achievement or employer signal is created.

## SC-CP-05 — Pause, complete and withdraw safely

1. Pause an active plan as staff.
2. Confirm the student can still see its history.
3. Complete the plan with a final visible note.

Expected:

- states are recorded rather than deleting history;
- completion resolves the linked support request;
- restart after completion requires support review rather than silently overwriting the old plan.
