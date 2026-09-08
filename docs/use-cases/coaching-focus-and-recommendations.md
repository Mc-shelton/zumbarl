# Coaching Focus and Recommendations

**Depends on:** [Shared setup](./shared-setup-and-test-data.md)

## CR-01 — Activate and persist a practice focus

1. Sign in as Aisha and open `/campus/learn?view=path`.
2. Start or select a roadmap.
3. Under **Your career coach**, select one to five roadmap skills.
4. Set the weekly target to `4` and activate the plan.
5. Reload.

Expected:

- [ ] Selected skills and weekly target survive reload.
- [ ] The enrollment stores the chosen Skill IDs and coaching update time.
- [ ] The save button disables when nothing changed.
- [ ] Prior checkpoint progress and XP remain intact.

## CR-02 — Enforce selection rules

| Attempt | Expected |
| --- | --- |
| No skills | HTTP `400` |
| More than five skills | HTTP `400` |
| Skill outside the roadmap | HTTP `400`, `INVALID_COACHING_SKILL` |
| Weekly target below `1` or above `7` | HTTP `400` |
| Another student's enrollment | HTTP `404` without data leakage |
| Unauthenticated request | HTTP `401` |

## CR-03 — Map learning resources

- [ ] Current-checkpoint resources appear under **Learn and practise**.
- [ ] Title and provider/type are visible.
- [ ] A resource opens the correct guided-practice route.
- [ ] Unrelated-roadmap resources do not appear.
- [ ] Missing resources produce an honest empty state.

## CR-04 — Map practice gigs

- [ ] Opportunities matching focus competencies or skills appear.
- [ ] Stronger matches rank first with company, score, and reasons.
- [ ] Unrelated opportunities are absent.
- [ ] Existing applications and active projects retain their engagement state.
- [ ] Links open the correct opportunity, application, or project.

## CR-05 — Map industry exposure

- [ ] Only future published events are considered.
- [ ] Skill-relevant events rank ahead of weaker matches.
- [ ] Only recent published posts from active company pages are considered.
- [ ] Matching uses skill names, slugs, and meaningful terms.
- [ ] Company updates open the correct managed profile.
- [ ] No relevant records produces an explanatory empty state.

## CR-06 — Suggest coaches from the network

1. Create a follow or connect relationship with the Network peer.
2. Ensure the peer has a selected skill and verified gig experience.
3. Keep another skilled student outside Aisha's network.
4. Reload and open the peer.

Expected:

- [ ] The network peer appears with matching skills and campus.
- [ ] More experienced matching peers rank ahead.
- [ ] The peer opens at `/campus/profiles/:studentId`.
- [ ] The out-of-network student does not appear.
- [ ] Removing the relationship removes the suggestion on a later read.

## CR-07 — Change the focus

1. Replace the selected skill and change the weekly target.
2. Save and reload.

Expected:

- [ ] Every recommendation section recalculates for the new focus.
- [ ] Old focus selections are removed.
- [ ] Earned history is not erased.
- [ ] The client cannot submit arbitrary recommendation results.

## API smoke test

```bash
curl -sS -X PATCH "$ZUMBARL_API_BASE/learn/roadmaps/$ENROLLMENT_ID/coaching-focus" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H 'Content-Type: application/json' \
  --data "{\"skillIds\":[\"$ROADMAP_SKILL_ID\"],\"weeklyTarget\":4}"

curl -sS "$ZUMBARL_API_BASE/learn/roadmaps/$ENROLLMENT_ID/coaching-plan" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  | jq '{focus, resources, opportunities, events, companyUpdates, coaches, placements, possibilities}'
```

## Acceptance

This feature passes when one persisted skill choice changes learning, practice, exposure, coaching, and placement possibilities without fabricating results.
