# Career Progression Foundations

**Depends on:** [Shared setup](./shared-setup-and-test-data.md)

## CP-01 — Capture the starting progression

1. Sign in as Aisha.
2. Open `/campus/profile` and select **Overview**.
3. Find **Measurable career progress**.
4. Record the work mode, career stage, skill levels, progress percentages, evidence gates, verified gigs, clients, reliability, endorsements, confidence, and suggested rates.

Expected:

- [ ] Career stage is shown as `stage N of 5`.
- [ ] Completed, current, and locked stages are distinguishable.
- [ ] Each skill shows current level, percentage, next level, and evidence gates.
- [ ] Trust values are based on verified profile activity.
- [ ] A provisional score is not presented as an established public score.
- [ ] Rates are clearly advisory.

Save this as the baseline for later comparison.

## CP-02 — Verify the five-stage path

Inspect Explore, Build, Grow, Lead, and Mentor.

- [ ] Stages appear in the correct order.
- [ ] The current stage agrees with the student's evidence.
- [ ] Future stages state what is still required.
- [ ] Changing work mode does not directly advance a stage.
- [ ] Reloading preserves the current stage and historical timestamps.

## CP-03 — Advance a skill at an automatic boundary

1. Choose a non-Expert skill close to its next threshold.
2. Complete enough verified work to satisfy every next-level gate.
3. Reload the profile.

Expected:

- [ ] The skill advances only after every required gate is met.
- [ ] Progress resets against the following level's gates.
- [ ] The transition time is persisted.
- [ ] Expert is never awarded automatically.
- [ ] Expert eligibility requires gigs, clients, reliability, endorsements, and assessment evidence.

## CP-04 — Preserve career history

1. Record the current stage timestamp.
2. Switch between Earn now, Balanced, and Build career.
3. Trigger recalculation without completing new work.
4. Reload.

Expected:

- [ ] Work-mode changes do not rewrite stage history.
- [ ] Recalculation without new evidence does not create duplicate transitions.
- [ ] Existing stage timestamps remain stable.
- [ ] A real evidence-based stage transition creates one new historical record.

## CP-05 — Reject misleading evidence

- [ ] Draft, pending, rejected, or quarantined work does not increase verified gigs.
- [ ] Duplicate processing does not count one project twice.
- [ ] A high-value contract alone cannot bypass reliability or client-diversity gates.
- [ ] Self-declared skills do not appear as evidence-backed levels.
- [ ] The client cannot submit its own level, XP, trust score, or career stage.

## Acceptance

This feature passes when the student has a measurable, persistent path whose advancement is entirely traceable to verified evidence.
