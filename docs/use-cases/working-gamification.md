# Working Gamification

**Depends on:** [Shared setup](./shared-setup-and-test-data.md) and [Coaching focus and recommendations](./coaching-focus-and-recommendations.md)

## WG-01 — Verify Foundation is functional

Record level, XP, next-level distance, progress percentage, weekly progress, target, streak, and quest states.

Expected for a new/low-activity enrollment:

- [ ] XP below `200` is Foundation.
- [ ] The UI shows XP remaining before Builder.
- [ ] Weekly progress comes from persisted activity.
- [ ] Each incomplete quest opens a real action.
- [ ] A Foundation badge alone does not imply placement readiness.

## WG-02 — Complete guided practice

1. Open a guided practice from its quest.
2. Submit valid responses and reflection.
3. Return and reload.

Expected:

- [ ] One `LearningPracticeSubmission` is persisted.
- [ ] Practice adds `20 XP`.
- [ ] The practice quest becomes **Done this week**.
- [ ] Weekly progress increases by one but is capped at the target.
- [ ] Reading the plan again does not duplicate XP.

## WG-03 — Complete an assessment

1. Open and submit the active checkpoint assessment.
2. Return to the coaching plan.

Expected:

- [ ] The server scores and persists the attempt.
- [ ] Awarded points contribute to XP.
- [ ] The assessment quest completes for the week.
- [ ] A lower repeat attempt does not replace the checkpoint's best score.

## WG-04 — Complete verified work

1. Submit roadmap evidence or complete matching paid work.
2. Obtain authorized verification.
3. Reload.

Expected:

- [ ] Pending evidence adds no verified-work XP.
- [ ] Verified evidence adds its awarded score.
- [ ] The verified-work quest completes.
- [ ] The competency becomes `EVIDENCE_VERIFIED` while in progress.
- [ ] Synchronization does not duplicate evidence.

## WG-05 — Cross exact level boundaries

| XP | Expected level |
| ---: | --- |
| `0` and `199` | Foundation |
| `200` and `499` | Builder |
| `500` and `849` | Practitioner |
| `850+` | Career ready |

- [ ] Levels change at exact thresholds.
- [ ] Progress remains between `0%` and `100%`.
- [ ] Career ready reports the highest level.
- [ ] Changing focus or target awards no XP.

## WG-06 — Calculate streaks

| Activity | Expected |
| --- | --- |
| No activity | `0` weeks |
| This week | `1` week |
| This and last week | `2` weeks |
| Last week only | At least `1` week |
| A missing week between active weeks | Streak stops at the gap |

Qualifying activity is verified evidence, an assessment attempt, or a practice submission.

## WG-07 — Protect game integrity

- [ ] XP and level are calculated server-side.
- [ ] Reloading does not reset progress.
- [ ] Repeated reads do not change progress.
- [ ] Rejected or quarantined evidence contributes nothing.
- [ ] Weekly progress never displays above its target.

## Acceptance

This feature passes when every visible game value responds predictably to persisted student activity and cannot be awarded by the client.
