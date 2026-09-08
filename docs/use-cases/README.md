# Zumbarl End-to-End Use Cases

This folder contains feature-based acceptance suites for connected Zumbarl journeys.

## Test suites

- [Career and coaching](#career-and-coaching-execution-order): from a first gig to an evidence-backed placement.
- [Student Care](./student-care/README.md): from a private check-in to accountable human support, programs, peer circles and follow-up.

## Career and coaching execution order

1. [Shared setup and test data](./shared-setup-and-test-data.md)
2. [Career progression foundations](./career-progression-foundations.md)
3. [Opportunity matching and student pricing](./opportunity-matching-and-pricing.md)
4. [Business trust and verified completion](./business-trust-and-completion.md)
5. [Coaching focus and recommendations](./coaching-focus-and-recommendations.md)
6. [Working gamification](./working-gamification.md)
7. [Evergreen placement transition](./evergreen-placement-transition.md)
8. [Integrity, accessibility, and regression](./integrity-accessibility-and-regression.md)

## Product promise

The suite verifies that:

```text
Student chooses an earning/career direction and skills to practise
                              ↓
Zumbarl recommends suitable learning, people, events, and work
                              ↓
Verified activity advances measurable skills and career stages
                              ↓
The same evidence explains trust to businesses and placement programs
```

The suite does not pass merely because a level or coaching card is visible. Choices must persist, recommendations must change, evidence must be traceable, and readiness thresholds must be enforced.

## Sign-off summary

| Feature | Test document | Result |
| --- | --- | --- |
| Career path and evidence gates | Career progression foundations | PASS / FAIL |
| Work discovery and pricing | Opportunity matching and pricing | PASS / FAIL |
| Business-facing trust | Business trust and verified completion | PASS / FAIL |
| Personalized coaching | Coaching focus and recommendations | PASS / FAIL |
| XP, quests, levels, and streaks | Working gamification | PASS / FAIL |
| Placement readiness and matching | Evergreen placement transition | PASS / FAIL |
| Security and quality | Integrity, accessibility, and regression | PASS / FAIL |

Overall acceptance requires every feature row to pass.
