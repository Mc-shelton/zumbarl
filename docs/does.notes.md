The current flow starts with an **opportunity**, not a project:

1. **Business creates the opportunity**
   
   It is saved as a private draft with `escrowStatus: "unfunded"`. No project or escrow exists yet. [manageBusinessWorkflowsService.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/business/manageBusinessWorkflowsService.ts:227)

2. **Business funds and publishes**
   
   “Fund & Publish” first calls `/opportunities/:id/fund`, then `/publish`. Funding creates an `OpportunityEscrowHold`. Partial top-ups are supported, and the payment reference prevents duplicate funding submissions. The opportunity becomes `funded` once the sum of `FUNDED` holds covers its budget. [businessWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/business/businessWorkflows.repository.ts:1437)

   Publishing is blocked until the entire opportunity budget is covered. [manageBusinessWorkflowsService.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/business/manageBusinessWorkflowsService.ts:296)

3. **Student applies and agrees on a price**
   
   The agreed amount is the student’s bid amount, or the opportunity budget when no bid amount exists. If negotiation pushes the agreed price above escrow coverage, the business must top up before awarding. [businessWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/business/businessWorkflows.repository.ts:98)

4. **Awarding creates the project**
   
   Awarding is blocked unless escrow covers the agreed amount. A task creates a dedicated project for that student; team-project awards join one shared project. The agreed amount is snapshotted onto the project. [businessWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/business/businessWorkflows.repository.ts:1975)

5. **Business starts the project**
   
   Escrow coverage is checked again. The project cannot start if funds no longer cover the agreed amount. Starting locks the scope. [projectWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/projects/projectWorkflows.repository.ts:836)

6. **Work is submitted and approved**
   
   For individual projects, approving work triggers payment. The agreed total is distributed across deliverables or milestones according to their budget/payment percentage.

   For team projects, approving individual submissions is feedback only. The business uses **Mark complete**, after which that scope’s amount is split among contributors according to their submission counts. [projectWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/projects/projectWorkflows.repository.ts:624)

7. **Student wallet is credited**
   
   Approval creates a payout record, increments the relational `Wallet.balance`, reduces any `pendingBalance`, and writes a completed `STUDENT_PAYOUT` transaction atomically. [walletLedger.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/shared/services/walletLedger.ts:47)

**Important Reality Check**

Escrow currently enforces the workflow, but it is **not yet real payment custody**:

- Funding does not debit `CompanyWallet`.
- Wallet, card, bank, and M-Pesa selections do not actually contact a payment provider.
- The API trusts the submitted amount/reference and immediately records it as `FUNDED`.
- Student payouts credit their wallet without drawing down `OpportunityEscrowHold`.
- The relational hold remains `FUNDED`; release bookkeeping still uses the older generic `escrows` and `payouts` records.
- Payout currency is currently hardcoded to `KES`.

So the lifecycle guards work, and students receive database wallet credit, but real money has not yet moved from the business into a safeguarded escrow account. The next finance phase needs to connect company debits/payment confirmation, escrow allocation, release/refund, and student withdrawal into one relational ledger.





###############
For a business **accepting/awarding an applicant**, the backend currently enforces only a small set of rules.

**Enforced Rules**

1. **Caller must have a business or admin role.**
   
   The award endpoint is `POST /business/applicants/:bidId/award`. [registerBusinessRoutes.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/entrypoint/api/routes/business/registerBusinessRoutes.ts:60)

2. **The applicant’s bid must exist.**

3. **Escrow must cover the agreed price.**
   
   The agreed price is:
   - The student’s bid or accepted counter-offer, when greater than zero.
   - Otherwise, the opportunity budget.

   Awarding returns `409 ESCROW_BELOW_AGREED_AMOUNT` when funded coverage is insufficient. [businessWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/business/businessWorkflows.repository.ts:98)

4. **Accepting immediately awards the bid and creates/joins a project.**
   
   There is no separate “accepted but not awarded” state. The bid becomes `awarded`, receives a `projectId`, and the student is added to the project team.

5. **Task opportunities accept one applicant.**
   
   Awarding a task automatically closes further applications with `applicationsClosedReason: "awarded"`.

6. **Team projects can accept multiple applicants.**
   
   All awarded applicants join the same project. Applications remain open until the business manually marks the opportunity at capacity. There is currently no configured maximum team size. [businessWorkflows.repository.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/repositories/business/businessWorkflows.repository.ts:2002)

**Not Currently Required**

The backend does **not** require:

- Shortlisting first.
- An interview.
- A completed interview.
- Applicant KYC or verification.
- A minimum score, skill match, rating, or portfolio quality.
- An accepted counter-offer before awarding.
- The bid to be in a specific valid status.
- The application deadline still to be open.
- The caller’s business to own the opportunity.

That last point is a security gap: the award service receives only the bid ID and actor ID, and does not verify that the authenticated business owns the associated opportunity. [manageBusinessWorkflowsService.ts](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl_backend/src/adapters/services/business/manageBusinessWorkflowsService.ts:543)

**Other Current Gaps**

- A rejected or removed bid can potentially be awarded through a direct API request.
- Re-awarding the same task bid can create another project because the endpoint is not idempotent.
- A pending counter-offer does not block awarding.
- Team awards do not reserve escrow per applicant or ensure the combined commitments remain within escrow.
- The older “three repeat hires, then mentorship unlock” guardrail is local frontend state only; it is not enforced by the API. [businessFlowService.js](/Users/pro/olscorpe_wd/subsidiaries/zumbarl/zumbarl.com/src/features/business/services/businessFlowService.js:354)

So, practically, the real rule today is: **authenticated business/admin + existing bid + enough recorded escrow**. The remaining hiring rules are mostly UI guidance and need backend enforcement before this is production-safe.