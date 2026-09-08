# Integrity, Accessibility, and Regression

**Depends on:** all feature use cases listed in [the index](./README.md)

## IQ-01 — Ownership and privacy

- [ ] A student can read and update only their own coaching focus.
- [ ] A business cannot alter a student's focus, target, XP, or level.
- [ ] Unauthorized requests return `401` or `403` as appropriate.
- [ ] Another student's enrollment returns `404` without leaking data.
- [ ] Coach discovery is limited to follow/connect relationships.
- [ ] Coaching responses expose no private candidate, company, or placement notes.
- [ ] A possibility never claims that a company selected the student.

## IQ-02 — Idempotency and evidence integrity

- [ ] Repeated roadmap reads do not duplicate synchronized evidence.
- [ ] Repeated coaching-plan reads do not change XP.
- [ ] Repeated project completion creates one engagement outcome and one payment.
- [ ] Pending, rejected, and quarantined evidence contributes no verified-work progress.
- [ ] The client cannot set its own level, score, XP, stage, or match result.
- [ ] Invalid focus updates leave the prior valid focus unchanged.

## IQ-03 — Loading and failure states

- [ ] Loading does not display another roadmap's coaching plan.
- [ ] A failed save preserves the unsaved selection for retry.
- [ ] Buttons prevent duplicate submission while saving.
- [ ] Empty sections explain how to unlock results.
- [ ] API errors appear as actionable messages.
- [ ] A completed legacy roadmap without an explicit focus can still derive available skills.

## IQ-04 — Accessibility

- [ ] Skill chips are keyboard operable and expose `aria-pressed`.
- [ ] Focus controls have accessible names.
- [ ] Status is not communicated using color alone.
- [ ] Focus, quest, resource, coach, and placement links have visible focus styles.
- [ ] Content remains usable at 200% zoom.
- [ ] Screen-reader order follows the visual task sequence.

## IQ-05 — Responsive layout

Repeat at approximately `390px`, `768px`, and `1440px`.

- [ ] Level card and progress summary do not overlap.
- [ ] Skill selector and weekly target remain usable.
- [ ] Quests stack cleanly on narrow screens.
- [ ] Coaching sections do not overflow horizontally.
- [ ] Long names truncate without hiding navigation.
- [ ] Career-stage and evidence-gate content remains legible.

## IQ-06 — Link integrity

- [ ] Learning resources open guided practice.
- [ ] Opportunities open the correct opportunity/application/project.
- [ ] Coaches open `/campus/profiles/:studentId`.
- [ ] Company updates open `/campus/organizations/:profileSlug`.
- [ ] Readiness and matches open their correct Evergreen routes.
- [ ] Browser back navigation returns to the same roadmap and focus.

## Automated regression

Backend:

```bash
cd zumbarl_backend
npm run prisma:generate
npm run build
npm test
```

Frontend:

```bash
cd zumbarl.com
npx eslint \
  src/features/learn/components/CareerCoachPanel.jsx \
  src/features/learn/services/learnService.js \
  src/pages/LearnPage.jsx
npm run build
```

Expected:

- [ ] Prisma generation passes.
- [ ] Backend TypeScript build passes.
- [ ] API integration test covers focus persistence and every coaching-plan collection.
- [ ] Evergreen acceptance tests pass.
- [ ] Focused frontend lint passes.
- [ ] Frontend production build passes.

## Final sign-off

| Field | Value |
| --- | --- |
| Tester |  |
| Test date |  |
| Commit/branch |  |
| Environment |  |
| Student and roadmap |  |
| Initial/final stage |  |
| Initial/final XP and level |  |
| Matching program |  |
| Screenshots/evidence |  |
| Automated result |  |
| Overall result | PASS / FAIL |
| Defects |  |

Sign off only when the complete chain—student choice, recommendation, verified activity, measurable progression, business trust, and placement eligibility—works without bypassing ownership or evidence thresholds.
