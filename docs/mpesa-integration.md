# M-Pesa Integration

Zumbarl's core gig-to-career payment path uses two Daraja APIs:

- **Lipa na M-Pesa Online (STK Push)** moves business money into an
  opportunity's escrow ledger. An opportunity is never considered funded from
  the initiation response; only the matching result callback can fund it.
- **Business to Customer (B2C)** moves a student's available Zumbarl wallet
  balance to their Safaricom number. The amount is reserved before submission,
  completed only from a matching receipt, and returned once if Safaricom sends
  a failure or timeout result.

Card, bank-transfer and marketplace-checkout settlement are separate provider
projects and are not represented as working M-Pesa flows by this integration.

## Required configuration

Keep all values in the deployment secret store or an uncommitted `.env`. Never
put credentials in frontend variables, source code, screenshots or commits.

```dotenv
# Sandbox while testing; use the production Daraja origin after go-live approval.
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...

# Lipa na M-Pesa Online / STK Push
MPESA_SHORT_CODE=174379
MPESA_PASSKEY=...

# A public HTTPS origin routed to this backend. Do not include /api/v1.
MPESA_CALLBACK_BASE_URL=https://api.example.com
MPESA_REQUEST_TIMEOUT_MS=15000

# B2C withdrawals
MPESA_B2C_SHORT_CODE=...
MPESA_INITIATOR_NAME=...
MPESA_SECURITY_CREDENTIAL=...
```

The B2C security credential is the encrypted Daraja credential, not the STK
passkey and not the initiator password. The Daraja application must have both
Lipa na M-Pesa Online and B2C products enabled for the selected environment.

Run the non-transactional readiness check from `zumbarl_backend`:

```bash
npm run mpesa:verify
```

For the wider deployment gate, run `npm run go-live:verify` with the production
environment loaded. Production configuration is rejected before startup when
the callback origin is private, TLS verification is disabled, B2C is incomplete,
or other launch-critical settings are unsafe.

It tests OAuth and public callback configuration without printing secrets or
sending money. `configuration_ready_not_transaction_tested` means the next gate
is a controlled KES 1 sandbox transaction; it is not production sign-off.

## Inbound escrow funding

1. The business selects **Mobile Money STK Push**, enters a Kenyan Safaricom
   number and confirms.
2. `POST /api/v1/business/opportunities/:id/fund` creates one pending payment
   and ledger entry, then submits the STK request.
3. The browser polls the authenticated payment resource and periodically asks
   for an STK status reconciliation. Provider-query failures do not start a
   second payment.
4. Safaricom posts to the request-specific, tokenized callback URL.
5. Zumbarl matches the callback token, merchant ID, checkout ID, exact amount,
   phone number and receipt.
6. One transaction credits the company wallet and one transaction moves the
   same amount into the opportunity escrow. Full funding can publish the saved
   opportunity atomically.

No incoming amount is credited from the STK initiation response or from a
successful query response that lacks a receipt.

## Student withdrawal

1. The student chooses **Withdraw to M-Pesa** from the project earnings rail.
2. `POST /api/v1/finance/mpesa/payouts` reserves the requested wallet amount and
   submits one B2C request.
3. Safaricom posts a result or timeout to its request-specific callback URL.
4. Zumbarl matches the callback token, conversation IDs, exact amount,
   recipient where supplied, and transaction receipt.
5. A successful result completes the payout. An explicit failure or timeout
   restores the wallet and writes one refund ledger entry.

If the network disconnects after a provider request is sent, the outcome stays
`PROCESSING`; it is unsafe to assume failure and immediately refund or retry.
The original callback can still settle it. Operations must investigate an
old processing request before manually changing balances.

## Idempotency and security

- A client reference is unique, and only one active STK request per opportunity
  and one active B2C request per student can be provider-claimed.
- Callback tokens are generated with high entropy and only their SHA-256 hashes
  are stored.
- Callback application is serialized with database advisory locks. Replayed
  successful callbacks return the existing result without moving money again.
- Provider receipts and provider checkout/conversation IDs are unique.
- Payment reads require the owning business/student or a finance role. Provider
  callbacks are the only unauthenticated finance routes and require their
  request-specific secret plus provider-ID matching.
- API errors retain useful provider codes but do not expose consumer secrets,
  access tokens, passkeys or security credentials.

## Deployment and go-live checklist

1. Apply migrations with the deployment migration command and confirm
   `mpesa_payment_requests` exists.
2. Route the public HTTPS callback origin to the backend, preserving the full
   generated callback path; do not place a login or browser redirect in front
   of it.
3. Run `npm run mpesa:verify` in the target environment.
4. In sandbox, complete one successful and one cancelled STK request, then one
   successful and one failed B2C request. Verify wallet, escrow, receipt and
   refund records after replaying each callback.
5. Confirm the deployed logs and proxy access logs redact callback path tokens.
6. Before production, replace every sandbox value with the production Daraja
   application's values and repeat the controlled test with the approved
   shortcode and Safaricom test numbers.
7. Add an operations alert for old `PROCESSING` payments and reconcile them with
   the provider before any manual adjustment.

## Local verification status — 30 September 2026

- Database migrations: applied locally; all 24 migrations are aligned, including
  payment records and their audit-safe relations.
- Provider/ledger automated tests pass, including callback validation,
  duplicate suppression and one-time B2C refunds.
- Full backend suite: 46 files and 241 tests passing.
- Frontend lint/build: passing.
- Public callback URL check: **not passing**; the configured URL is a private
  LAN address and cannot receive Daraja callbacks.
- Daraja OAuth: **passing** against the sandbox origin.
- B2C: **not externally testable yet**; initiator name and encrypted security
  credential are not present in the current backend environment.

Therefore the integration is implemented and internally verified, but live
money is not signed off until the callback and B2C gates pass and the four
controlled sandbox outcomes above have been recorded.
