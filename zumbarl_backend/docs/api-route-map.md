# Zumbarl API Route Map

## Frontend Route Coverage

| Frontend surface | Backend support |
| --- | --- |
| `/login`, `/register` | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/auth/me` |
| `/business/workspace` | `GET /api/v1/business/dashboard`, `GET/PATCH /api/v1/business/profile` |
| `/business/opportunities` | `GET/POST /api/v1/business/opportunities`, publish, fund, invite, applicants |
| `/business/opportunities/create` | `POST /api/v1/business/opportunities`, `POST /api/v1/business/opportunities/:id/publish` |
| `/business/applicant-profile` | `GET /api/v1/business/opportunities/:id/applicants`, `POST /api/v1/business/applicants/:id/review-events`, `POST /api/v1/business/applicants/:id/award` |
| `/business/marketing` | `GET/POST /api/v1/marketing/campaigns` |
| `/business/marketing/create` | `POST /api/v1/marketing/campaigns`, fund, publish, invite |
| `/business/marketing/:campaignId` | campaign detail, proofs, stats, endorsements |
| `/campus/opportunities` | `GET /api/v1/earn/opportunities`, `GET /api/v1/earn/bids`, `GET /api/v1/earn/projects` |
| `/campus/opportunities/:opportunityId/place-bid` | `POST /api/v1/earn/opportunities/:id/bids` |
| `/campus/opportunities/marketing/:campaignId` | `POST /api/v1/marketing/campaigns/:id/accept`, `POST /api/v1/marketing/campaigns/:id/proofs` |
| `/campus/projects/:projectId` | `GET /api/v1/projects/:id`, tasks, milestones, deliverables, review |
| `/campus/learn` | ladders, roadmap creation, lock, evidence, tests, verify |
| `/campus/explore`, `/campus/community` | Connect feed, stories, posts, reactions, comments, tags, groups, chamas |
| `/campus/opportunities/buy-sell` | marketplace shops, listings, cart, orders |
| `/campus/cart*` | cart items, order creation, fulfillment and review routes |
| `/campus/profile` | auth profile, earn trust snapshot, learn credentials, marketplace shop/reviews |
| `/help` | wellness reports, counselor bookings, support cases |

## Workflow Action Routes

- `POST /api/v1/business/opportunities/:id/fund` gates award/review by escrow.
- `POST /api/v1/projects/milestones/:id/activate` enforces milestone funding before locked execution.
- `POST /api/v1/projects/deliverables/:id/review` applies the max-three-revisions rule and creates payout readiness.
- `POST /api/v1/marketing/campaigns/:id/publish` starts the invite-only window.
- `POST /api/v1/learn/roadmaps/:id/evidence` gives 80-point evidence scoring; tests are capped at 20 points.
- `GET /api/v1/connect/tags/:type/:id/context` resolves typed tags into cross-surface context panels.
- `POST /api/v1/marketplace/orders/:id/status` moves fulfillment from seller confirmation to completed or refund-required.
