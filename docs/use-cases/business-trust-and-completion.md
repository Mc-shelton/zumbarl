# Business Trust and Verified Completion

**Depends on:** [Shared setup](./shared-setup-and-test-data.md), [Career progression foundations](./career-progression-foundations.md), and [Opportunity matching and pricing](./opportunity-matching-and-pricing.md)

## BT-01 — Explain student trust to a business

1. Sign in as the Business.
2. Open Opportunity B's applicants and select Aisha.
3. Open Aisha's public profile.
4. Find **Evidence-backed career progression**.

Expected:

- [ ] The business sees stage, skill levels, verified gigs, client diversity, reliability, endorsements, and confidence.
- [ ] Each trust claim is presented as evidence-backed.
- [ ] The business can see Aisha's focus but cannot modify it.
- [ ] Private development recommendations are not exposed as negative labels.
- [ ] A provisional numeric score is withheld from the public view.

## BT-02 — Award work at the agreed price

1. Return to Aisha's application.
2. Complete any required shortlist/interview stages.
3. Award Opportunity B.
4. Start the project if required.

Expected:

- [ ] One project workspace is created.
- [ ] The agreed price equals the accepted application amount.
- [ ] The price cannot silently change after award.
- [ ] Aisha can open the work from Bids or Ongoing work.

## BT-03 — Complete one evidence cycle

1. As Aisha, open the required deliverable.
2. Upload a valid test file or evidence link and submit it.
3. As the Business, review it with explicit quality, adherence, communication, conduct, satisfaction, deadline, completion, and rehire answers.
4. Approve and complete the project.

Expected:

- [ ] Project status reaches Completed.
- [ ] Payment is recorded once.
- [ ] Exactly one verified engagement outcome exists for the student/opportunity pair.
- [ ] The outcome references the business, opportunity, project, category, contract value, and review.
- [ ] Score and progression refresh as part of completion.
- [ ] Retrying completion is idempotent.

## BT-04 — Compare student and business views

1. Reload Aisha's own profile.
2. Reload Aisha's public profile in the business browser.
3. Compare both with the baseline.

Expected:

- [ ] Verified gigs increase by exactly one.
- [ ] The relevant skill receives the new evidence.
- [ ] Reliability, client diversity, and trust update consistently.
- [ ] Private guidance remains private.
- [ ] Both views explain the same verified facts without claiming identical permissions.

## BT-05 — Validate duplicate and failure handling

- [ ] Re-approval does not issue a second payment.
- [ ] Re-completion does not create a second engagement outcome.
- [ ] A rejected or revision-requested deliverable does not count as verified completion.
- [ ] An unrelated skill is not credited merely because the opportunity was completed.

## Acceptance

This feature passes when a business can understand why to trust the student and completed work updates that trust exactly once.
