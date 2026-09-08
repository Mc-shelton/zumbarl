# Opportunity Matching and Student Pricing

**Depends on:** [Shared setup](./shared-setup-and-test-data.md) and [Career progression foundations](./career-progression-foundations.md)

## OM-01 — Publish contrasting opportunities

1. Sign in as the Business.
2. Create Opportunity A and Opportunity B from the shared test data.
3. Complete every required scope and deliverable field.
4. Fund and publish both.

Expected:

- [ ] Both records are persisted.
- [ ] Neither is student-visible before full funding and publication.
- [ ] Both become discoverable after publication.

## OM-02 — Earn now changes ranking

1. Sign in as Aisha and select **Earn now** on the profile.
2. Reload to confirm persistence.
3. Open `/campus` and record **Recommended for you** ordering.

Expected:

- [ ] Opportunity A's stronger earning signal is prioritized when suitability permits.
- [ ] The recommendation includes an understandable earning-oriented reason.
- [ ] Selecting this mode does not apply for any work automatically.

## OM-03 — Build career changes ranking

1. Select **Build career**.
2. Reload the profile and Campus home.
3. Compare the same two opportunities.

Expected:

- [ ] Skill-aligned Opportunity B moves ahead of the off-path task.
- [ ] The result includes a skill/career-alignment reason.
- [ ] The mode is stored server-side.

## OM-04 — Balanced combines both signals

1. Select **Balanced** and reload.
2. Inspect both recommendations.

Expected:

- [ ] Ranking uses both suitability and earning potential.
- [ ] The selected mode survives a reload.
- [ ] An invalid mode receives HTTP `400` and does not alter the stored mode.

## OM-05 — Show level-aware rate guidance

1. Open Opportunity B and choose **Place bid**.
2. Continue to pricing.
3. Record the matched skill, level, suggested range, and explanation.
4. Select the suggested-price action, then replace it with another valid amount.
5. Submit the completed application.

Expected:

- [ ] Guidance uses the closest relevant profile skill.
- [ ] The KES range references market guidance, skill level, and reliability.
- [ ] The suggestion enters the field only when selected.
- [ ] The student remains free to edit the amount.
- [ ] The submitted bid contains the final edited amount.
- [ ] Individual work does not show team shared-budget rules.

## API diagnostic

Inspect `.recommendationSections[] | select(.id == "gigs")` from `GET /api/v1/campus/home` after each mode change. Compare array order, `progressionMatchScore`, and `recommendationReason` for the two timestamped titles.

## Acceptance

This feature passes when intent changes real ordering and level-aware pricing guides—but never controls—the student's decision.
