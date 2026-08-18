# Milestone-based project opportunities — workspace spec

Status: spec — stage 1 built, stages 2-5 not started
Owner: engineering
Last updated: 2026-07-30

Companion to `deliverable_project_workspace_spec.md`, which covers the
deliverable-based shape. This one covers the third shape: a continuous project
where students join as paid contributors, interns or attachees.

## 1. Where this actually stands today

Milestone mode is largely unbuilt. What exists:

| Piece | State |
|---|---|
| Milestone records | **real** — `workflowRecord('milestones')`, with fund + activate |
| Milestone submissions and payout | **real** — shares the deliverable payout engine |
| Board / Sprints / Timeline / Milestones panels | **mock** — render from `data/mockWorkspace.js` |
| "Project program gates" panel | **mock** — local React state from `createInitialProjectProgramState()`; the buttons patch state and nothing else |
| Sprints | **do not exist** — no model, no table, no endpoint |
| Project tasks | vestigial — `workflowRecord('tasks')` holds `title`/`ownerId`/`status`/`dueAt`, unreferenced by any real flow |
| Contributor roles | `ProjectTeamMember.role` is a free string, used only as a label |

So the panel in question is a training-ground mock. It should not ship as-is:
it presents seven gates and six actions that do nothing, on a real project with
real money.

**Recommendation:** keep the concept, drop the panel from the default view.
The gates are a good checklist of the milestone lifecycle, but they belong on
the Milestones tab attached to a specific milestone, driven by real state, not
as a permanent banner above every project. Stage 2 below implements them
against the real record.

## 2. The hierarchy

```
Milestone            budget, window, funding, activation
  └─ Deliverable     the unit the business approves and pays
       └─ Task       declared work, owned by a contributor
            └─ Sprint assignment  (a task may sit in at most one sprint)
```

Two independent timelines, as requested:

- **Milestone track** — each milestone plotted on its own window
- **Deliverable track** — deliverables plotted independently, so a deliverable
  spanning two milestones is visible as such
- **Sprint track** — derived: a sprint's span is the min/max of its tasks' dates

A task belongs to a deliverable (which belongs to a milestone) *and* optionally
to a sprint. Sprint membership is a scheduling overlay, never ownership — moving
a task between sprints must not change who is credited for it.

## 3. Kanban, shared

One board, both sides. Columns follow the task lifecycle already built for
deliverable projects (`todo → in_progress → blocked → submitted → done`), so
milestone mode inherits the same states rather than inventing a parallel set.

- Students: declare, claim, move, block, submit.
- Business: read, comment, review submissions, resolve dependencies it owns.
  It does **not** move another person's card — same rule as deliverable mode.

Sprint scope is what filters the board. "This sprint" is the default view;
"all open" is a toggle.

## 4. Contributor roles and earnings

Roles: **earner**, **intern**, **attachee**. Set per member on the project team.

The business configures, per project:

- whether interns are allowed
- whether attachees are allowed
- for each non-earner role: an **earning factor** (0–100%)

Distribution runs in two passes:

1. Compute raw workload shares exactly as today — approved, evidence-backed
   task weight over the total.
2. Scale each non-earner's raw share by their role's factor. The freed
   remainder is redistributed across the full earners in proportion to their
   own raw shares.

A factor of 0 means the intern earns nothing and their contribution passes to
the paying contributors; 40 means they take 40% of what their work would
otherwise have earned. An earner is always 100% and cannot be reduced.

This keeps one property that matters: **the workload record is unchanged by
the earning policy**. An intern's contribution is still counted, still visible,
still on their record — the policy only decides what it converts into.

Rules:

- Policy is read at payout time from the project's settings, so changing it
  mid-project affects only unpaid work.
- If every contributor on a target is a zero-factor non-earner, the target pays
  nobody and the budget stays in escrow rather than silently vanishing.
- Role changes are logged; a member's role at payout time is what applies.

## 5. Project Settings tab

Business-only, project-scoped:

- Contributor roles: allow interns / allow attachees
- Earning factor per non-earner role
- (later) sprint cadence, catchup schedule

## 6. Build stages

1. **Project settings + role earning policy** — schema, API, settings tab,
   and the payout engine honouring it. *Built.*
2. **Real program gates** — replace `createInitialProjectProgramState` with the
   milestone's actual funding/activation/scope state, and move the panel onto
   the Milestones tab.
3. **Tasks under deliverables under milestones** — extend `DeliverableTask`
   with a milestone link so the existing task engine covers milestone mode.
4. **Sprints** — model, assignment, board filtering.
5. **Timeline** — milestone, deliverable and sprint tracks from real dates.

Stages 3-5 are the bulk. Stage 3 is the prerequisite for both 4 and 5, because
sprints schedule tasks and the timeline plots them.
