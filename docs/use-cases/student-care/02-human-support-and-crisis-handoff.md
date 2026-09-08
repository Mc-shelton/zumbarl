# Human Support and Crisis Handoff

## SC-HU-01 — Named support request reaches operations

1. As the student, choose **Human support**.
2. Select counseling, turn anonymous mode off, add synthetic text and send.
3. As the operator, open `/admin/student-care` → **Support requests**.

Expected:

- exactly one open request appears;
- its urgency, category and message match;
- the operator can take the case and the status becomes **In review**;
- the student sees the updated status in their support activity.

## SC-HU-02 — Anonymous request protects identity

1. Send an anonymous request and save its reference.
2. Inspect the operations payload and UI.

Expected:

- `studentId` is absent;
- the operator sees **Anonymous request**;
- no UI implies the team can contact the anonymous student directly;
- the student is told to retain the reference.

## SC-HU-03 — Counselor request becomes a confirmable appointment

1. Request a future counselor time.
2. Confirm it appears under **Appointments** as **Requested**.
3. Confirm it as the operator, then reload the student's Wellbeing page.

Expected:

- requested is not presented as confirmed beforehand;
- the confirmed state is visible to the student;
- completion and no-show are distinct operational outcomes.

## SC-HU-04 — Urgent Talk It Out response is honest

1. In a disposable environment, send synthetic imminent-danger language to Talk It Out.
2. Observe the assistant response before choosing a handoff.

Expected:

- AI generation is bypassed for urgent language;
- immediate in-person/emergency guidance appears;
- no support case exists yet and the UI does not claim anyone was contacted;
- **Ask the support team to follow up** is available.

## SC-HU-05 — Explicit handoff controls message sharing

1. Open the handoff flow and leave **Share my latest message** off.
2. Consent to a named follow-up and submit.
3. Verify the operations case contains a request but not the private message.
4. Repeat with another disposable conversation and sharing enabled.

Expected:

- both handoffs require explicit consent;
- only the second case contains the latest message;
- the student receives an accurate confirmation of what was shared;
- the handoff is still labelled non-emergency.
