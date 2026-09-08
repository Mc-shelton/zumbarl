# Shared Setup and Test Data

Use this setup for every use case in this folder.

## Environment

Use a disposable development or test database. Several scenarios create and fund opportunities, submit applications, verify evidence, and complete work.

Backend:

```bash
cd zumbarl_backend
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev
```

Frontend, in another terminal:

```bash
cd zumbarl.com
npm install
npm run dev
```

The backend defaults to `http://localhost:4100`. Use the frontend URL printed by Vite.

## Actors

| Actor | Email | Password | Purpose |
| --- | --- | --- | --- |
| Student | `student@zumbarl.test` | `password123` | Aisha; owns the progression and coaching plan |
| Network peer | `kevin.mutua@zumbarl.test` | `password123` | Coach discovery and profile navigation |
| Business | `business@zumbarl.test` | `password123` | Publishes, awards, and reviews work |
| Admin | `admin@zumbarl.test` | `password123` | Reviews roadmap evidence |

Use separate browser profiles when concurrent sessions are required.

## Contrasting opportunities

Append a timestamp to every test title.

| Field | Opportunity A — earn signal | Opportunity B — career signal |
| --- | --- | --- |
| Title | `E2E Cash Data Entry Sprint` | `E2E Social Media Portfolio Sprint` |
| Type | Individual task | Individual task |
| Skills | Data Entry | Social Media, Content Strategy |
| Budget | KES 4,000 | KES 1,000 |
| Work mode | Remote | Remote |
| Deliverable | Completed spreadsheet | Content plan document |

Opportunity A deliberately pays more. Opportunity B deliberately matches Aisha's seeded career skills.

## Coaching recommendation records

Ensure the database contains:

- a published roadmap with at least two checkpoints and two Skill-linked competencies;
- a learning resource on the active checkpoint;
- one matching and one unrelated published opportunity;
- one matching and one unrelated future event;
- one matching and one unrelated recent company-page post;
- one network peer and one out-of-network student with the selected skill;
- an active Evergreen program with an accepting cohort and a matching skill;
- a second program whose competency minimum is above the student's evidence score.

## Evidence controls

Where a use case needs controlled boundaries, create evidence only through supported application flows. Record IDs and timestamps for cleanup. Do not edit production data or reuse a non-disposable database.

## Test record

| Field | Value |
| --- | --- |
| Tester |  |
| Test date |  |
| Commit/branch |  |
| Database/environment |  |
| Student |  |
| Roadmap |  |
| Test-data timestamp |  |
