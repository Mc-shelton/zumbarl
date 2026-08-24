Learn & Grow was already conceived as a graph product; the difference is that its current implementation is mostly a linear, mocked workflow. Graph technology is the missing engine that can turn that original plan into a genuinely personalized system.

| Learn & Grow plan | Current implementation | Graph-powered implementation |
|---|---|---|
| Build a baseline from skills, portfolio, posts, work and reviews | “Build baseline” changes local page state | Traverse all verified evidence connected to the student |
| Generate a personalized roadmap | Three predefined ladders and fixed checkpoints | Construct a path from current competencies to a target career |
| Recommend learning resources | Static resources inside checkpoint constants | Rank resources by missing competency, prerequisite and learner context |
| Recommend relevant opportunities | Static example opportunities | Match live opportunities to active competency gaps |
| Score evidence at 80% and tests at 20% | Button adds predetermined points | Evidence links to competencies and is assessed using versioned rubrics |
| Unlock the next checkpoint | Predetermined linear levels | Unlock when prerequisite competencies have sufficient verified evidence |
| Recommend exposure | Static attachment, mentor and office-tour examples | Match students to live businesses, mentors, programs and placements |
| Verify career readiness | Frontend requires 90; backend currently accepts 70 | Evaluate a versioned, explainable set of competency requirements |
| Make students discoverable to businesses | Basic verified-roadmap pool | Businesses search a talent graph by competency, evidence and readiness |

### The graph behind Learn & Grow

The intended model is more than a list of roadmap steps:

```text
Student
  ├──HAS_EVIDENCE──▶ Portfolio item / Project / Campaign / Post / Review
  │                         └──PROVES──▶ Competency
  ├──ENROLLED_IN──▶ Career track
  │                      └──CONTAINS──▶ Stage
  │                                         └──REQUIRES──▶ Competency
  └──NEEDS──▶ Competency
                    ├──PREREQUISITE_OF──▶ Competency
                    ├──TAUGHT_BY──▶ Resource
                    ├──PRACTISED_IN──▶ Opportunity
                    └──REQUIRED_BY──▶ Internship / Job / Exposure
```

This lets Zumbarl answer important questions that the current linear implementation cannot:

- What does Aisha already know?
- Which evidence proves it?
- What competency is missing for her next stage?
- What is the shortest credible path to internship readiness?
- Which live gig would provide the best missing evidence?
- Which mentor or business can validate that evidence?
- Why is a particular opportunity being recommended?

### Where the existing plan and graph model align

The original Learn & Grow plan included:

- Interactive roadmap trees
- Prerequisites and checkpoints
- Verified work evidence
- Opportunity locking
- Resource and project recommendations
- Market-ready tiers
- Mentorship, internship and attachment exposure
- Career verification

Those are all naturally graph-based concepts. In fact, Learn & Grow is a stronger justification for graph technology than social recommendations because the relationships are meaningful, auditable and relatively stable.

### What needs to change

The database already has `CareerRoadmap`, `CareerRoadmapStep`, `StudentRoadmapEnrollment`, `Skill`, `StudentSkill` and `OpportunitySkill`. However:

- Roadmap skills are currently stored partly as string arrays.
- Completed steps and evidence URLs are also stored as arrays.
- The active Learn page uses static frontend constants.
- The Learn API uses a separate generic roadmap record representation.
- Submitted evidence is automatically marked verified.
- Evidence is not connected to real projects, deliverables or competencies.
- Frontend verification uses 90%, while the backend accepts 70%.

So we currently have both a data-model split and a scoring inconsistency.

### Recommended unified model

The previously planned Learn model should become the canonical graph:

- `CareerTrack` and versioned `CareerStage`
- `Competency`, distinct from a generic skill tag
- `StageCompetency` for requirements and prerequisites
- `StudentTrackEnrollment`
- `StudentCompetencyState`
- `OpportunityCompetency`
- `LearningResource` and `ResourceCompetency`
- Append-only `EngagementEvidence`
- Rubric-based `EvidenceAssessment`
- Auditable `StageTransition`
- Versioned `RecommendationSnapshot`

A competency might be “Build an accessible responsive React form,” while the broader skill tags would be React, HTML/CSS and UI quality.

### Best implementation order

1. Pilot one ladder—Digital Marketing is the best candidate because Zumbarl already has campaigns, creators, posts and performance evidence.
2. Build the competency and evidence graph in PostgreSQL.
3. Connect completed campaigns, projects, posts and business reviews to competencies automatically.
4. Make opportunity recommendations use actual competency gaps.
5. Replace mock Learn state with API-backed enrollment and progress.
6. Add graph projection infrastructure only when recommendation traversal requires it.

The strategic conclusion is that graph technology does not replace the Learn & Grow plan. It provides the structural foundation the plan was implicitly asking for. Learn & Grow should become the central competency graph, while Connect, Marketing, Projects and Opportunities continuously produce evidence and exposure for it.