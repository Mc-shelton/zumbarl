# Deliverable-based project opportunities — workspace spec

Status: built (steps 1-6)
Owner: engineering
Last updated: 2026-07-28

## 1. Problem

Zumbarl has three opportunity shapes, but the project workspace only understands two:

| | Task | Project · deliverable | Project · milestone |
|---|---|---|---|
| Who works | 1 student | team | team |
| Unit of work | the task | **the deliverable** | the milestone |
| Coordination | none | **declared tasks in a deliverable** | backlog, sprints, board |
| Payment trigger | approval | approval per deliverable | milestone approval |
| Payout split | n/a | **by declared workload** | by milestone contribution |

The workspace picks its tabs from `project.hasTeam`, defined in
`projectWorkspaceService.js` as "not a task opportunity, and somebody is on the
team". `scopeMode` never enters the decision, so every team project inherits
Board, Timeline, Sprints and Milestones plus the program-gates strip
("Milestone funding", "Backlog + sprint plan", "Scope lock"). A deliverable
project ends up wearing milestone furniture: sprint donuts and "Milestone 2"
headers over work that has neither.

`hasTeam` conflates two independent axes:

- **who works** — solo or team (`isTeamProject`)
- **how work is structured** — deliverable or milestone (`scopeMode`)

They must be separated. Tabs follow `scopeMode`; team features follow
`isTeamProject`.

## 2. Product intent

A deliverable-based project is **a task opportunity that grew a team**, not a
project that shrank. Students do not need sprints, a board, a timeline or
milestone ceremonies. They need to divide one deliverable among themselves,
see who is doing what, unblock each other, and be paid in proportion to the
work they actually did.

Worked example. A business posts *Brand Development*. One deliverable is
*Brand Book*. Four students collaborate: one starts on brand assets, another
on brand policies, a third on the logo suite, a fourth on typography — which
cannot start until the logo suite is done. Both sides can see that picture at
any moment.

## 3. The Deliverable Room

The deliverable becomes a container, not a table row. Opening one shows:

- **Declared tasks** — the plan, owned by named students
- **Contributors** — derived from claimed tasks, with live share %
- **Thread** — discussion scoped to this deliverable
- **Files** — working files, distinct from the final submission
- **Submission history** — what went to the business, feedback, revisions

Tab set for `scopeMode: 'deliverable'`: Overview, Work & Deliverables, Team,
Messages, Files, Reviews, Activity Logs. No Board, Timeline, Sprints or
Milestones. The program-gates strip is milestone-mode only.

## 4. Declared tasks

A student "declares" what they intend to contribute to a deliverable. This is
separate from the existing board task (`title`/`ownerId`/`status`/`dueAt`),
which has no scope link and no weight, and is milestone-mode furniture.

```
DeliverableTask
  projectId, scopeItemId        // which deliverable
  title, description
  ownerId                       // null = unclaimed, in the shared pool
  weight        Int  (1..5)     // effort claim
  status        todo | in_progress | blocked | done | dropped
  blockedByIds  String[]
  evidence      Json            // files / submissions fulfilling it
  declaredById, declaredAt, claimedAt, doneAt
  droppedReason
```

Lifecycle: **declare** → **claim** (owner set) → **in progress** → **done**
(evidence attached). Unclaimed tasks sit in a shared pool so a member can find
work without being assigned — there is no project manager in this shape.

Two integrity rules:

- Declaring is public and logged. A task appearing after the work is done
  reads differently from one declared up front.
- Dropping requires a reason and does not delete. The task stays visible as
  `dropped`. Silent deletion is how workload histories get rewritten.

## 5. Workload → payout split

Today a team deliverable is split **equally among whoever submitted to it**.
One student who uploads the file takes an equal share with someone who did
three times the work, and a member who worked but never pressed Submit gets
nothing. That is the unfairness being fixed.

```
share(student) = Σ weight of their done tasks / Σ weight of all done tasks
```

applied through the existing `shareOfAgreedTotal` remainder rule so the parts
sum to the deliverable budget exactly.

This is the only place in the product where students' money depends on
students' own claims, so the formula needs a lock, not just arithmetic:

1. **Live and always visible.** The room shows "Brian 45% · KES 18,000",
   updating as tasks move. Imbalance becomes a conversation on day two, not a
   dispute on day thirty.
2. **Weights are cheap early, expensive late.** Free while unclaimed. Once
   claimed, a raise needs another member's acknowledgement. After lock, frozen.
3. **Lock at submission.** Submitting snapshots the split. Contributors then
   confirm their share; the snapshot — not the live tasks — is what payout
   reads, whether or not everyone has confirmed yet.
4. **Only `done` tasks with evidence count.** Done with nothing attached
   carries zero weight.
5. **The business never arbitrates.** They approve the deliverable; the split
   belongs to the team. Escalation goes to admin, not the client.
6. **Fallback.** A deliverable with no declared tasks keeps today's equal
   split, so a team that ignores the feature is still paid.

## 6. Blocking

`blockedByIds` plus a first-class `blocked` status. What makes it useful is the
behaviour around it:

- The blocker's owner is notified — a block is a message to a person, not a
  flag on a card.
- Auto-unblocks when the blocking task reaches `done`; nobody maintains it.
- The deliverable header shows blocked count and the age of the oldest block.
  Block age is the most useful health signal a business can see.
- Blocked time is excluded from a student's responsiveness stats, so being
  blocked never looks like slacking.

## 7. Business-side transparency

Transparency runs both ways or students read it as surveillance. Per
deliverable the business sees contributor avatars with live shares, task counts
by state, blocked items with age, and submission history. **Read-only** — a
business cannot reassign a task or change a weight. They may comment on a task,
which turns scope feedback into something that arrives before a submission
rather than a rejection after it.

## 8. Policy decisions

Defaults chosen for the first build; revisit with usage.

| Question | Default |
|---|---|
| Who may declare tasks | any team member (the pool model dies otherwise) |
| Who may close a pending task | any team member, on anyone's task. Credit follows the task's owner, so closing a teammate's work pays them, not the closer |
| Contributor confirmation at lock | explicit confirm, no auto-timeout, and **non-blocking**: the submission still reaches the business while confirmations are outstanding. Blocking paid work on one unresponsive member was judged the worse failure |
| Weight scale | abstract points 1–5, not hours (less falsifiable, fewer legal implications) |
| Late joiners | may claim unclaimed tasks; existing tasks reassign only if the owner drops |
| Dropped task weight | does not transfer; the new owner declares fresh |

## 9. Build order

1. Split `hasTeam` into `isTeamProject` + `scopeMode`; drive tabs and the
   program-gates strip off `scopeMode`.
2. Deliverable Room shell — detail view, contributors, files, thread.
3. `DeliverableTask` model, declare/claim/done, shared pool.
4. Live share calculation, display only, no money touched.
5. Blocking + notifications.
6. Switch payout from equal split to the locked weighted snapshot, with the
   equal-split fallback.

Steps 1–5 carry no risk to disbursement. Step 6 is the only one that touches
money, and by then shares have been visible long enough to be trusted.
