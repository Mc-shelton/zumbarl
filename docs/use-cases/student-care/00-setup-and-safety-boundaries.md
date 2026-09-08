# Setup, Actors and Safety Boundaries

## Environment

Use a disposable database because these scenarios create sensitive test records.

```bash
cd zumbarl_backend
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

In another terminal:

```bash
cd zumbarl.com
npm install
npm run dev
```

Never enter a real person's health, counseling, recovery or safety information in test data.

## Actors

| Actor | Account | Purpose |
| --- | --- | --- |
| Student | `student@zumbarl.test` | Private check-ins, care programs and circles |
| Student peer | `kevin.mutua@zumbarl.test` | Confirms sensitive activity is not visible socially |
| Student Affairs operator | `admin@zumbarl.test` | Uses the restricted operations workspace |
| Unauthorized business user | `business@zumbarl.test` | Verifies access denial |

Use separate browser profiles for the student and operator.

## Seeded care resources

Confirm these are active after seeding:

- Steady Under Pressure;
- Belonging, Boundaries & Peer Pressure;
- Recovery Navigation & Staying Well;
- First-Year Peer Support circle;
- Recovery & Staying Clean Circle;
- campus counseling and Student Affairs resources.

## Safety boundaries

- Zumbarl coordinates support; it does not diagnose, prescribe, detoxify or deliver clinical rehabilitation.
- Immediate danger guidance must direct the student toward a nearby person, campus security, emergency department or locally approved emergency channel.
- Never claim that a counselor, emergency service or staff member has been contacted until a persisted handoff exists.
- Program enrollment is named and requires explicit consent. Circle participation may use an alias.
- Testers must not infer that a recovery setback means failure, non-compliance or loss of eligibility.

## Test record

| Field | Value |
| --- | --- |
| Tester |  |
| Date |  |
| Commit |  |
| Environment |  |
| Student ID |  |
| Operator ID |  |
| Cleanup completed | YES / NO |
