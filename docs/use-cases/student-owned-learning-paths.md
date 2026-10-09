# Student-owned Learning Paths

**Depends on:** [Shared setup](./shared-setup-and-test-data.md)

## LP-01 — Join more than one path

1. Sign in as a student and open `/campus/learn?view=path`.
2. Join one catalogue path.
3. Select **Add another path**, search for a different path, and join it.
4. Switch between both paths and reload.

Expected:

- [ ] Both paths remain active with independent progress, skills, resources, and weekly targets.
- [ ] Joining an already-active path does not create a duplicate enrollment.
- [ ] Switching paths does not discard either path's state.

## LP-02 — Search or create a missing path

1. Search using a complete title, partial title, career-family term, and skill term.
2. Search for a path title that does not exist.
3. Create it with a description, duration, and at least one skill.

Expected:

- [ ] Relevant existing paths are ranked before weaker matches.
- [ ] An exact existing title is offered instead of creating a duplicate.
- [ ] The new path is searchable and reusable by another student.
- [ ] Creating the path also enrolls its creator.

## LP-03 — Search or create skills

1. While creating a path, search for an existing skill using different casing or punctuation.
2. Select the existing skill.
3. Search for a genuinely missing skill and create it.

Expected:

- [ ] Equivalent skill names resolve to one catalogue skill.
- [ ] The missing skill can be created and selected without leaving the flow.
- [ ] Skill selection alone does not mark the skill verified.

## LP-04 — Customize skills without changing other students

1. Enroll Aisha and Kelvin in the same path.
2. As Aisha, remove one default skill and add another.
3. Reload both students' paths.

Expected:

- [ ] Aisha sees her customized skill set.
- [ ] Kelvin retains the original defaults.
- [ ] The shared catalogue path and its defaults are unchanged.
- [ ] A removed path skill is not destructively removed from Aisha's global profile history.

## LP-05 — Discover, select, and refresh resources

1. Join a path containing skills linked to published learning resources.
2. Inspect the recommended resource list without selecting anything.
3. Add one recommendation to the learning plan and leave another unselected.
4. Publish another matching resource in the repository.
5. Confirm it is absent before the weekly refresh boundary.
6. Advance the test clock by seven days (or backdate the enrollment refresh marker), then reopen the learning path.

Expected:

- [ ] Matching published resources appear as recommendations and are not added to the student's plan automatically.
- [ ] Match information explains relevance to the path.
- [ ] Only the selected recommendation contributes to schedule and progress totals.
- [ ] A student can remove a selected resource before starting it.
- [ ] Reopening the path after seven days automatically adds the newly published recommendation without requiring a refresh action.
- [ ] Reopening the path again inside the same seven-day window does not run another repository refresh.
- [ ] Creating a path or changing its skills refreshes recommendations immediately instead of waiting for the weekly check.
- [ ] Automatic refresh does not reset selected, completed, or in-progress resources.
- [ ] Removing a skill removes obsolete unselected recommendations but preserves selected and completed history.
- [ ] Unpublished or inaccessible resources are never recommended.

## LP-06 — Track weekly resource accountability

1. Record the total, completed, remaining, weekly target, and completed-this-week values.
2. Mark one resource complete.
3. Complete another through its guided practice.
4. Change the weekly target and reload.

Expected:

- [ ] Both completion mechanisms update resource progress exactly once.
- [ ] Completed-this-week uses the current calendar week.
- [ ] The recommended initial pace is based on remaining resources and estimated path duration.
- [ ] A student-selected weekly pace persists independently per path.

## LP-07 — Verify skills from real work

1. Add an unverified skill to the path.
2. Complete learning resources only.
3. Complete and obtain approval for Zumbarl work tagged with that skill.
4. Reload the learning path.

Expected:

- [ ] Resource completion advances learning progress but does not verify the skill.
- [ ] Approved work, verified portfolio or campaign evidence, or a business endorsement can verify a matching skill.
- [ ] Pending, rejected, or unverified work cannot verify it.
- [ ] Reprocessing the same evidence does not inflate the verified-work count.
- [ ] The skill displays a traceable **Work verified** state.

## Acceptance

This feature passes when students can independently build several reusable paths, customize their own skills, receive refreshable repository resources, follow a measurable weekly schedule, and earn skill verification only through trusted work evidence.
