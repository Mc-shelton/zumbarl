# Privacy, Accessibility and Regression

## SC-PR-01 — Sensitive data isolation

After creating check-ins, a Talk It Out conversation, support cases and a recovery plan, verify that none appear in:

- Connect feed or story;
- public/student profile viewed by another user;
- campus search;
- messages inbox;
- business applicant profile;
- Zumbarl Score, career XP or working streak;
- opportunity, coaching or Evergreen matching inputs.

Expected: zero sensitive content or derived labels leak into these surfaces.

## SC-PR-02 — Direct-object access protection

1. Capture IDs for another student's conversation, case and enrollment.
2. As the test student, substitute those IDs into student routes.
3. As a business user, try both student and operations routes.

Expected: 403 or 404 without confirming sensitive record existence.

## SC-PR-03 — Consent integrity

Attempt enrollment and handoff requests with missing consent, false consent, malformed status and excessive notes.

Expected:

- API validation rejects each request;
- no partial support case or enrollment is created;
- consent version and timestamp exist on successful enrollment.

## SC-PR-04 — Keyboard and screen-size behavior

Test Wellbeing and Student Care Operations at desktop, tablet and mobile widths using keyboard-only navigation.

Expected:

- focus reaches every check-in, pathway, consent and action control;
- modal focus remains usable and closing never submits;
- status is communicated by text, not color alone;
- cards do not overflow horizontally except intentionally scrollable tabs.

## SC-PR-05 — Existing wellbeing regression

Confirm after the Student Care additions that:

- daily check-ins and pattern toggles still work;
- Talk It Out messages remain private and ordered;
- reset brain-dump text remains local only;
- counselor and anonymous support requests still submit;
- support-circle chat, posts, scheduling, RSVP and audio admission still work.

## SC-PR-06 — Data lifecycle review

Before production sign-off, verify documented retention, deletion, export, breach-response and staff-access policies for wellbeing and recovery data.

Expected:

- policy owners approve retention periods;
- access is auditable and reviewed;
- backups and exports follow the same sensitivity controls;
- production release is blocked if these governance controls are absent.
