# Zumbarl AI Workflows

This file translates the available `docs/zumbarl_processes.md` process notes into implementation workflows. It is intentionally living documentation; update it as the source process notes mature.

## 1. Opportunity / Gig / Job Workflow

### Actors
- Business: creates, funds, publishes, invites, reviews, interviews, awards, reviews work, endorses.
- Student: discovers or accepts invite, bids, interviews when required, completes work, submits deliverables, revises when requested.
- Zumbarl: holds budget, gates review actions, records payment readiness, credits student after approval.

### End-to-End Workflow
1. Business creates an opportunity brief with title, company context, requirements, budget, timeline, deliverables, acceptance criteria, and bidder instructions.
2. Business publishes the opportunity.
3. Business can invite matching bidders after publishing.
4. Students either place a bid directly or accept an invite and then submit a bid.
5. Business reviews bids.
6. Business accepts an offer and chooses whether to skip or require interview.
7. Business pays the agreed budget to Zumbarl before award/work review actions are allowed.
8. If interview is required, business uploads interview questions/files or schedules a call.
9. Business moves bidder to awarded stage or drops the bidder after interview.
10. If the interview changes scope or price, business updates the offer and pays any pending budget revision.
11. Student does the work, including work completed outside the platform where relevant.
12. Student submits deliverables.
13. Business can view submitted work at any time.
14. Business can only approve or request changes when all required budget or revision payments are paid to Zumbarl.
15. Business accepts work or requests revision.
16. Revision requests are capped at three.
17. If accepted, student is credited the amount.
18. Business reviews the student and gives feedback.
19. Opportunity moves to done.

### UX States
- Draft: brief is being prepared.
- Published: opportunity is visible and invite actions are available.
- Bidding: direct and invited bids are accepted.
- Offer Review: business reviews bids and decides interview path.
- Budget Escrow: award path is blocked until budget is paid.
- Interview: questions, files, or call scheduling are managed.
- Awarded: student can start work.
- Submitted: business can view deliverables.
- Review Locked: submitted work is visible but action buttons are disabled because revised budget is unpaid.
- Revision Requested: student must resubmit; max three cycles.
- Approved: payment readiness and endorsement are recorded.
- Done: opportunity is closed with feedback.

### UI Entry Points
- Business opportunity creation: `/business/opportunities/create`
- Business opportunity management: `/business/opportunities`
- Business applicant review: `/business/applicant-profile`
- Student bid submission: `/campus/opportunities/:opportunityId/place-bid`
- Project workspace and submitted work review: `/campus/projects/:projectId`
- Current mock gates: award requires budget payment; submitted work review is locked until pending revision budget is marked paid; revision requests are capped in the workflow model.

## 2. Marketing Campaign Workflow

### Actors
- Business: creates, funds, publishes, invites campaigners, reviews proof and results, endorses top campaigners.
- Student campaigner: accepts when eligible, runs campaign on social channels, submits proof.
- Zumbarl: enforces eligibility, invite-only window, budget limit, proof aggregation, and campaign stats.

### End-to-End Workflow
1. Business creates a marketing campaign with objective, platforms, content requirements, minimum follower/engagement criteria, campaigner payout rules, and budget.
2. Business pays for the campaign before publishing.
3. Business publishes the campaign.
4. Business invites campaigners.
5. Campaign is invite-only for the first 24 hours.
6. If invited campaigners do not consume the budget, the campaign opens to eligible students after 24 hours.
7. Students accept only when they pass campaign criteria.
8. Acceptances are capped by budget limit.
9. Students run the marketing campaign on their social channels.
10. Students submit proof of campaign work.
11. Zumbarl creates campaign stats from submitted proof.
12. Business views and reviews campaign results.
13. Business endorses top campaigners.

### UX States
- Draft: campaign requirements and criteria are being prepared.
- Fund Campaign: business pays the total campaign budget.
- Invite Window: selected campaigners can accept for 24 hours.
- Open Eligibility: eligible students can accept until the budget cap is reached.
- Campaign Live: campaigners execute social posts.
- Proof Submission: campaigners upload links, screenshots, and performance evidence.
- Stats Generated: Zumbarl aggregates reach, engagement, clicks, and proof quality.
- Results Review: business reviews campaign performance.
- Endorsement: business endorses top campaigners.
- Completed: campaign closes with stats and endorsements.

### UI Entry Points
- Business marketing management: `/business/marketing`
- Business campaign creation: `/business/marketing/create`
- Business campaign detail and results: `/business/marketing/:campaignId`
- Student campaign acceptance and proof submission: `/campus/opportunities/marketing/:campaignId`

## 3. Project / Team Program Workflow

### Actors
- Business: creates project brief, defines objectives and milestone budgets, opens team applications, funds milestones, manages scope, reviews work, and gives feedback.
- Student: joins as stipend contributor, attachment learner, internship participant, or per-deliverable contributor; plans work with the team, attends catchups, submits milestone evidence, and builds portfolio/training proof.
- Zumbarl: calculates student pay from milestone budget, engagement term, role weight, and Zumbarl score; holds milestone funds; locks activated milestone scope; disburses funds after approval; records skill and training evidence.

### End-to-End Workflow
1. Business creates a project opportunity with clear objectives, team roles, term options, expected learning outcomes, milestone budgets, and acceptance criteria.
2. Business opens or closes project team bidding.
3. Students apply to join the team under one of four terms: stipend team role, attachment placement, internship track, or per-deliverable contributor.
4. Zumbarl calculates student pay using milestone budget, term type, role weight, and Zumbarl score.
5. Business reviews and accepts team members.
6. Business releases milestone funds to Zumbarl before the milestone can activate.
7. Students and business organize backlog tasks, sprint scope, owners, due dates, and weekly catchup cadence.
8. Zumbarl prevents milestone activation until funding, backlog, sprint plan, owners, and catchups are ready.
9. Once activated, the milestone locks backlog and sprint scope. The team can move task status, add comments, upload evidence, and unblock work, but cannot remove or add committed work without a new milestone change cycle.
10. Zumbarl auto-creates weekly catchup prompts for planning, blockers, evidence review, and student learning reflection.
11. Students execute the work in Kanban, attend catchups, and submit milestone deliverables and learning evidence.
12. Business reviews submitted milestone work, approves it or requests fixes.
13. Approved milestone funds are disbursed to students according to calculated pay and contribution term.
14. Zumbarl records the student’s skill growth, attachment/internship evidence, business feedback, and portfolio outcome.
15. The next milestone can then be funded, planned, locked, executed, reviewed, and paid using the same cycle.

### UX States
- Project Draft: business prepares objectives, roles, milestones, budgets, and learning outcomes.
- Team Bidding Open: students can apply for stipend, attachment, internship, or delivery terms.
- Admission Review: business accepts team members and Zumbarl calculates pay.
- Milestone Funding: business releases milestone budget to Zumbarl.
- Planning Ready: backlog, sprint, owners, due dates, and catchup cadence are prepared.
- Scope Locked: milestone is activated and committed work cannot be added or removed.
- Execution: team moves Kanban cards, handles blockers, and attends weekly catchups.
- Submission: students submit milestone deliverables and training evidence.
- Business Review: business approves or requests fixes.
- Disbursement: Zumbarl pays students and records portfolio, skill, and training credit.

### UI Entry Points
- Team project workspace: `/campus/projects/team-social-media-content-creation`
- Project tabs used by the workflow: Overview, Board, Sprints, Milestones, Timeline, Team, Activity Logs, Reviews
- Current mock gates: open bidding, join team, release funds, plan backlog/catchup, activate milestone, submit milestone, approve and disburse.

## 4. Learn / Career Ladder Workflow

### Actors
- Student: chooses a career ladder, reviews roadmap checkpoints, locks opportunity recommendations, completes tests, takes matching work, posts evidence, and builds a verified portfolio.
- Zumbarl: generates the roadmap tree, recommends resources and work exposure, scores checkpoints, weights verified work above tests, updates career tier, and issues verification.
- Business: contributes work evidence through projects, gigs, campaigns, internships, attachments, mentorship, office tours, and reviews; discovers verified students in transition-ready pools.

### End-to-End Workflow
1. Student chooses a career ladder or upskill program, such as frontend developer, digital marketer, data analyst, UI designer, or entrepreneur operator.
2. Student chooses intent: explore, earn while learning, attachment readiness, internship readiness, or job readiness.
3. Zumbarl builds a baseline profile from skills, portfolio, completed work, business reviews, posts, endorsements, and student goals.
4. Zumbarl generates an interactive roadmap tree with levels, checkpoints, resources, practice tasks, recommended opportunities, and evidence requirements.
5. Student reviews the roadmap and starts tracking progress.
6. Student opens checkpoint details to view resources, practice tasks, example projects, coaches, mentors, and matching work.
7. Student can lock opportunities to the roadmap so discovery prioritizes work tied to active checkpoints.
8. Every relevant Zumbarl activity updates checkpoint evidence: gigs, projects, marketing campaigns, posts, reflections, business reviews, tests, and portfolio uploads.
9. Zumbarl scores each checkpoint with 80% verified evidence and 20% tests/questions.
10. Completed checkpoints update portfolio evidence and recommend the next work exposure.
11. As checkpoints accumulate, student moves up market-ready tiers.
12. If exposure is needed, Zumbarl recommends attachment, internship, mentorship, office tour, or transition coaching programs.
13. When the roadmap is complete, Zumbarl verifies the student for that career ladder and adds the credential to the portfolio.
14. Businesses can discover verified or transition-ready students and invite them into interviews, internships, attachments, or structured project teams.

### UX States
- Ladder Selection: student chooses the target career ladder and intent.
- Baseline Profile: Zumbarl reads current skills, portfolio, work, posts, and reviews.
- Roadmap Generated: interactive checkpoint tree is created.
- Checkpoint Active: student opens resources, tasks, mentors, and opportunities.
- Roadmap Locked: opportunity discovery prioritizes checkpoint-relevant work.
- Evidence Updating: work, posts, reviews, tests, and portfolio uploads raise checkpoint scores.
- Tier Upgrade: student moves to a higher market-ready tier.
- Exposure Recommended: internship, attachment, mentorship, or office tour is suggested.
- Verified: roadmap credential is added to portfolio and business transition pools.

### UI Entry Points
- Student career ladder workflow: `/campus/learn`
- Related surfaces: `/campus/opportunities`, `/campus/projects/:projectId`, `/campus/profile`, `/business/applicant-profile`
- Current mock gates: choose ladder, generate roadmap, lock roadmap, open checkpoint resources, complete checkpoint evidence/test, upgrade tier, request exposure, verify roadmap.

## 5. Zumbarl Connect / Community Workflow

### Actors
- Student: creates a social identity, publishes stories/status updates, posts content, tags useful entities, reacts, comments, reposts, joins groups, attends clubs/events, and contributes to chamas.
- Zumbarl: enforces safety, keeps tags typed, routes tag actions into Earn/Learn/Marketplace/Profile/Groups, maintains group membership state, and records useful community proof.
- Group or Club Admin: creates regulated spaces, sets rules, approves members, posts updates, manages events, and configures chama contribution rules where relevant.

### End-to-End Workflow
1. Student opens Connect and confirms their campus social profile, interests, safety settings, and visible profile links.
2. Student creates a story/status update with text, media placeholder, visibility, and optional activity context.
3. Zumbarl publishes the story into the top story rail where viewers can open, react, reply, and view the author profile.
4. Student creates a post, blog, image/video update, poll, project update, or marketplace/community announcement.
5. Student adds typed tags such as project, product, person, group, club, event, opportunity, or learning roadmap.
6. Zumbarl publishes the post into the feed with reactions, comments, save, repost, follow, and report actions.
7. Viewer clicks a tag; Zumbarl opens a related side panel instead of losing context.
8. Project tags show score, achievements, reviews, status, and actions: bid when open or earn skill when closed.
9. Product tags show add to cart, product detail, shop owner, and shop page actions.
10. Person, group, or club tags show profile, mutual context, follow/message/join actions.
11. Student discovers or creates a group, club, event circle, support circle, or chama.
12. Student requests to join, accepts rules, and becomes a member when requirements pass.
13. Chama members can view goal, contribution cadence, wallet summary, and contribution ledger, then make a mock contribution.
14. Zumbarl checks content, comments, reports, and group activity for scams, harassment, unsafe content, and spam.
15. High-quality activity updates profile signals: interests, social proof, group roles, useful tags, creator activity, and community trust.

### UX States
- Profile Ready: student identity, visibility, and safety preferences are ready.
- Story Draft: status/story copy, visibility, and media context are prepared.
- Story Live: status appears in the story rail and can open the profile.
- Post Draft: student writes a post or blog and selects typed tags.
- Feed Live: post supports reactions, comments, saves, reposts, follows, and reports.
- Tag Context Open: related project, product, person, group, club, or roadmap appears in a side panel.
- Group Discovery: student chooses a group/club/chama and reviews purpose, rules, and member context.
- Membership Active: student joins and can contribute to group activity.
- Chama Contribution: contribution amount is recorded into a mock ledger and wallet summary.
- Safety Checked: content passes mock moderation and can contribute to profile/community proof.

### UI Entry Points
- Student Connect workflow: `/campus/community`
- Related surfaces: `/campus/explore`, `/campus/profile`, `/campus/learn`, `/campus/opportunities`, `/campus/opportunities/buy-sell`
- Current mock gates: prepare profile, publish story/status, publish tagged post, react/comment/repost, resolve tag action, join group, contribute to chama, run safety check, complete Connect proof.

## 6. Marketplace / Shop Workflow

### Actors
- Student Seller: creates a shop, publishes products/services, updates galleries/promos, confirms orders, packages items, handles pickup/drop-off, and earns shop trust.
- Student Buyer: browses listings, opens product/service details, adds to cart, pays, tracks fulfilment, confirms delivery, and reviews the seller.
- Zumbarl: enforces campus pickup/drop-off locations, order progress, buyer/seller protection, disputes/refunds, and marketplace score updates.

### End-to-End Workflow
1. Student seller creates a shop with name, category, campus, pickup/drop-off spots, contact rules, return rules, and safety terms.
2. Zumbarl creates a shop page and shareable handle/subdomain.
3. Seller uploads a product or service with price, stock, condition, variants, campus availability, delivery options, service scope where relevant, and product gallery.
4. Seller can update the gallery, promos, shop stories/status, and product/shop posts after publishing.
5. Marketplace discovery shows listings separately from the social/community feed while Connect can still show product/shop posts as tags.
6. Buyer browses categories, seller score, campus availability, shop stories, and safe pickup rules.
7. Buyer opens product details, chats/makes offer where relevant, adds to cart, reviews cart, chooses approved campus pickup/drop-off, pays, and places order.
8. Seller receives the paid order and confirms availability before packaging starts.
9. Seller moves the order through confirmed, packaging, ready for pickup/drop-off, in transit/handoff, delivered, and completed.
10. Buyer tracks progress, handoff location, transport/drop-off details, and pickup window.
11. If seller cannot fulfil, Zumbarl routes the buyer to refund/replacement and records reliability risk.
12. Buyer reviews item quality, description accuracy, handoff, timing, and seller communication.
13. Seller reviews buyer reliability, payment completion, pickup punctuality, and communication.
14. Zumbarl updates seller shop score and buyer score from order completion, delivery quality, reviews, and disputes.

### UX States
- Shop Setup: seller prepares shop identity, campus, policies, and pickup spots.
- Listing Draft: seller prepares product/service details, gallery, stock, pricing, and availability.
- Listing Live: item is discoverable in marketplace and taggable from Connect.
- Buyer Cart: buyer adds item/service and reviews cart.
- Checkout Paid: buyer chooses approved campus handoff and pays.
- Seller Confirmation: seller confirms stock/service availability.
- Packaging: seller prepares the item or books service slot.
- Campus Handoff: pickup/drop-off happens at an approved campus spot.
- Delivered: buyer confirms item/service received.
- Reviews + Scores: buyer and seller review each other and Zumbarl score updates.

### UI Entry Points
- Marketplace discovery and workflow: `/campus/opportunities/buy-sell`
- Product detail: `/campus/opportunities/buy-sell/:itemId`
- Buyer cart and checkout: `/campus/cart`, `/campus/cart/payment`, `/campus/cart/review`, `/campus/cart/order-placed`
- Related surfaces: `/campus/community`, `/campus/profile`
- Current mock gates: create shop, publish listing, update gallery/promo, add to cart, pay checkout, seller confirm, package, campus handoff, deliver, review, update shop/buyer score.
