
## The Two Sides First

Zumbarl has fundamentally different user types on each side. Before defining roles, be clear that a student and a company representative are not just different permission levels — they're different product experiences entirely. Some roles exist on both sides but mean different things.

---

## Student Side Roles

**Student — Standard**
The base role. Every campus user starts here after KYC verification.

What they can do:
- Browse and apply for gigs
- Access campus marketplace, notes, services
- Join chamas and community groups
- Use counseling and wellness features
- View their own score and portfolio
- Receive notifications and messages
- Access budget and finance tools

What they cannot do:
- Post gigs or opportunities
- See other students' full portfolios without permission
- Access transition mode features
- See company pipeline dashboards

---

**Student — Transition Mode**
Unlocked automatically when score and time thresholds are met. Not a separate signup — a permission upgrade triggered by the platform.

Additional access:
- Pipeline dashboard showing company relationship status
- Career intention settings
- Placement availability toggle
- Runway program features
- Transition coaching prompts
- Ability to receive formal placement offers

---

**Student — Alumni Window**
Activated at graduation. 12-month access window.

Access:
- Transition mode features remain active
- Gig marketplace access closes
- Campus marketplace and student services close
- Placement offer reception remains open
- Portfolio and certificate permanently accessible

---

**Campus Ambassador**
A student who represents Zumbarl on their campus. Recruited by Zumbarl, not self-appointed.

Additional access:
- Ability to post campus announcements
- Access to a simple ambassador dashboard showing referral stats
- Early access to new features for testing
- Cannot access other students' private data

---

**Club or Chama Admin**
A student who creates and manages a group, club, or chama on the platform.

Additional access:
- Manage group membership — approve, remove members
- Post within the group
- Manage group wallet and contribution settings for chamas
- Cannot see individual member financial details beyond contributions

---

## Company Side Roles

**Company — Standard**
The base role after business KYC verification.

What they can do:
- Post gigs and briefs
- View student profiles of applicants
- Rate and review students after gig completion
- Access basic pipeline dashboard
- Message students through the platform
- View their own company analytics

What they cannot do:
- See students who haven't applied or worked with them
- Access other companies' data
- Issue formal placement offers
- Access transition-ready student pool without a pipeline subscription

---

**Company — Pipeline Partner**
An upgraded company account that has completed at least 3 gigs and opted into the talent pipeline program.

Additional access:
- Full pipeline dashboard with student relationship statuses
- Ability to flag students as pipeline candidates
- Access to transition-ready student pool
- Ability to run Layer 2 rehearsal programs
- Ability to issue formal placement offers
- Notification when a pipeline student enters transition mode

---

**Company — HR Manager**
A named individual within a company account who manages the talent relationship. Multiple HR managers can exist under one company account.

Access:
- All standard company access
- Ability to add internal notes on student profiles visible only to their company
- Manage team endorsements
- View full gig history with all students
- Cannot change billing or company account settings

---

**Company — Hiring Manager**
A team lead or department head who posts briefs and reviews work but doesn't manage the overall talent relationship.

Access:
- Post briefs within their department
- Review and rate student submissions
- View student profiles of their applicants only
- Cannot see company-wide pipeline data
- Cannot issue placement offers — those require HR Manager or above

---

**Company — Viewer**
A read-only role for company stakeholders who need visibility but shouldn't take actions — a CEO who wants to see pipeline progress, for example.

Access:
- View company dashboard and analytics
- View pipeline status
- Cannot post, rate, message, or make offers

---

## Platform Side Roles — Zumbarl Internal

**Super Admin**
Only you and your most trusted technical co-founder or CTO. Full access to everything.

Access:
- All platform data
- User management — create, suspend, delete accounts
- Financial oversight — all transactions
- System configuration
- Safety report management
- Content moderation

---

**Operations Manager**
Your day-to-day team managing the platform.

Access:
- User support — view and edit user accounts to resolve issues
- Gig oversight — intervene in disputes
- Safety report handling — receive and action safety flags
- Cannot access financial configuration or system settings

---

**Campus Manager**
A Zumbarl employee or contractor responsible for a specific campus.

Access:
- View all students on their assigned campus
- Post campus-specific announcements
- Manage campus ambassador relationships
- Cannot see financial data or cross-campus data

---

**Safety Officer**
Dedicated role for handling harassment and safety reports. Critically — this role is siloed from everything else.

Access:
- Receive and manage safety reports
- View gig details related to a report
- Suspend company accounts pending investigation
- Cannot see unrelated user data
- Cannot access financial systems

This role being separate is important. The person handling a sexual harassment report should not also be doing customer support or gig moderation. The separation protects both the students reporting and the integrity of the process.

---

**Finance Officer**
Manages payment flows, student payouts, and company billing.

Access:
- Transaction oversight
- Payout management
- Chama wallet oversight
- Billing and subscription management
- Cannot see gig content, messages, or safety reports

---

**Content Moderator**
Reviews flagged content — marketplace listings, group posts, portfolio items.

Access:
- View flagged content
- Remove or approve flagged items
- Cannot see financial data or safety reports

---

## The Access Level Matrix

| Role | Gigs | Marketplace | Pipeline | Finance | Safety | Admin |
|---|---|---|---|---|---|---|
| Student Standard | Apply | Full | None | Own only | Report only | None |
| Student Transition | Apply | Full | Own pipeline | Own only | Report only | None |
| Alumni | None | None | Own pipeline | Own only | Report only | None |
| Campus Ambassador | Apply | Full | Own pipeline | Own only | Report only | Campus posts |
| Company Standard | Post | None | Basic | Own only | None | None |
| Pipeline Partner | Post | None | Full | Own only | None | None |
| HR Manager | Post | None | Full | None | None | None |
| Hiring Manager | Post | None | Limited | None | None | None |
| Super Admin | Full | Full | Full | Full | Full | Full |
| Operations | View/edit | View/edit | None | None | Handle | Partial |
| Safety Officer | Related only | None | None | None | Full | None |
| Finance Officer | None | None | None | Full | None | None |

---

## The Three Most Important Design Decisions In This List

**1. Safety Officer is siloed.** Never let safety report access bleed into general operations. A student who filed a harassment report should never wonder if the person handling their support ticket can also see their report.

**2. Transition mode is automatic, not applied for.** Students shouldn't have to request an upgrade — the platform grants it when criteria are met. Removing friction from that moment matters.

**3. Company Viewer role exists.** A CEO who can see pipeline progress but can't accidentally post a gig or message a student protects you from account misuse at senior company level.

---

Want me to map out what the permission logic looks like at the database or API level — specifically how you'd structure role-based access control in your React application?