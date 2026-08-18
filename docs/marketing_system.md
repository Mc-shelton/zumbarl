# Zumbarl Marketing System

Status: implementation baseline, August 2026

This document is the source of truth for Zumbarl Marketing. It separates the two related products that were previously mixed together:

1. **Creator Campaigns** — businesses fund campaigns, eligible students accept them, publish through their own channels, submit proof, and may receive verified endorsements.
2. **Social Publishing Studio** — organization users connect social accounts through OAuth, prepare content, obtain approval, schedule it, publish through provider APIs, and collect provider analytics.

Creator Campaigns are implemented in the current application. Social Publishing Studio is a staged integration and must not claim that a platform is connected until its OAuth credentials, scopes, provider review, secure token storage, and publishing workers are operational.

## Product principles

- A campaign starts with an objective and measurable result, not a post format.
- A business sees only its own drafts and campaigns. Students see only campaigns open to them. Administrators may audit all campaigns.
- Budget is enforced on the server. Accepting the same campaign twice must never reserve the payout twice.
- Reach and engagement shown as verified metrics come from submitted evidence or provider APIs; the system must not invent follower counts or performance.
- Proof and analytics are distinct. A creator submits evidence; a business reviews it; provider analytics can later corroborate it.
- Access tokens and refresh tokens belong only on the backend and must be encrypted.
- Organization roles should ultimately separate owner, editor, approver, and publisher responsibilities.

## Implemented creator-campaign lifecycle

```text
Draft
  → Published
  → Student acceptance
  → Creator publishes on an external channel
  → Proof submitted
  → Business generates/reviews statistics
  → Business endorses qualifying creator
  → Completed
```

### Business workflow

1. Open Business → Marketing.
2. Create a campaign with title, objective/type, audience, platforms, dates, budget, payout per campaigner, proof requirements, and materials.
3. Save as a draft or publish.
4. Review campaign status, committed budget, creator acceptances, proof submissions, verified reach, and engagement.
5. Generate aggregate statistics only after proof exists.
6. Endorse campaigners only after reviewing their proof.

The campaign list and metrics are loaded from `/api/v1/marketing/campaigns`. Placeholder campaign totals are not part of the operational flow.

### Student workflow

1. Open a published campaign.
2. Review payout, available budget, platforms, materials, requirements, and audience.
3. Accept the campaign. The backend checks campaign state, budget availability, duplicate acceptance, and eligibility.
4. Download/open approved materials.
5. Publish using the creator's own platform account.
6. Submit the live URL, notes, reach, and engagement as proof.
7. Wait for business review and possible endorsement.

Follower thresholds are intentionally blocked until verified social-audience data exists. The former hard-coded follower estimate was not reliable enough for eligibility or payment decisions.

## Campaign data ownership and visibility

| Actor | Campaign list | Campaign mutations |
|---|---|---|
| Business member | Campaigns belonging to their company | Create, fund, publish, invite, review statistics, endorse |
| Student | Published/open campaigns | Accept and submit proof |
| Administrator | All campaigns for oversight | Authorized administrative actions |

Future hardening should apply the same ownership check to every campaign-detail mutation, not only list visibility.

## Metrics

The dashboard follows objective-led reporting patterns used by mature campaign products. LinkedIn groups measurement into awareness, consideration, conversion, and revenue views and supports status, objective, time-range, and campaign filtering. Zumbarl should use the relevant subset:

- Awareness: verified reach, impressions, video views.
- Engagement: reactions, comments, shares, saves, engagement rate.
- Conversion: clicks, applications, sign-ups, purchases, conversion rate.
- Efficiency: committed spend, paid spend, cost per verified result.
- Creator operations: invitations, acceptances, proof pending, proof approved, payout ready.

Never combine self-reported evidence with provider-reported analytics without indicating the source.

## Social Publishing Studio architecture

### Required entities

```text
SocialConnection
- id
- managedProfileId
- connectedByUserId
- platform
- externalAccountId
- accountName
- encryptedAccessToken
- encryptedRefreshToken
- scopes
- expiresAt
- status
- capabilities

SocialPost
- id
- managedProfileId
- createdByUserId
- approvedByUserId
- caption
- mediaAssetIds
- status
- scheduledAt

SocialPostDestination
- id
- socialPostId
- socialConnectionId
- platformPayload
- providerPublishId
- status
- publishedAt
- failureCode
- failureMessage

SocialPostMetricSnapshot
- destinationId
- source
- capturedAt
- impressions
- reach
- views
- engagements
- clicks
- conversions
```

Tokens must be encrypted with a managed key, excluded from API responses and logs, rotated where supported, and deleted on disconnect. OAuth callbacks must validate a short-lived, single-use `state` value tied to the initiating user and organization.

### Publishing state machine

```text
draft → awaiting_approval → approved → scheduled → publishing
      → published
      → partially_published
      → failed_retryable
      → failed_terminal
```

One post creates one destination job per connected account. A partial failure must not mark successful destinations as failed. Workers need idempotency keys, retry limits, provider rate-limit handling, and webhook/status polling support.

### Provider constraints researched

- **TikTok:** Direct Post requires a registered app, approved `video.publish` scope, authorization from the target creator, a creator-info query before publishing, and asynchronous status checking. Unaudited clients are restricted to private visibility. TikTok also exposes account-specific privacy choices, disabled interactions, and maximum duration, so the composer cannot assume universal settings. [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started) and [Query Creator Info](https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info).
- **YouTube:** uploads require OAuth scopes such as `youtube.upload`; upload metadata and privacy are explicit fields. Uploads from unverified API projects are restricted to private viewing until the project passes the required audit. [YouTube videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert) and [Google OAuth for web-server apps](https://developers.google.com/identity/protocols/oauth2/web-server).
- **Instagram/Facebook:** integrations must use Meta authorization and eligible Page/professional-account capabilities rather than collecting user passwords. The precise supported publishing formats and permissions must be checked during Meta app review. [Instagram Platform](https://developers.facebook.com/docs/instagram-platform/) and [Pages API](https://developers.facebook.com/docs/pages-api/).
- **WhatsApp:** treat WhatsApp Business as permissioned messaging to opted-in recipients, not as a generic public social-post destination. Status publishing must not be promised unless Meta exposes and approves an applicable API.
- **LinkedIn-inspired operations:** campaign overview should surface setup tasks, delivery/status alerts, objective-grouped summaries, performance comparisons, and actionable recommendations rather than decorative totals. [Campaign Manager overview](https://www.linkedin.com/help/lms/answer/a7166382), [reporting dashboard](https://www.linkedin.com/help/lms/answer/a455158/-?lang=en-US), and [measurement insights](https://www.linkedin.com/help/lms/answer/a7136241).

## Delivery phases

### Phase 1 — creator campaigns (current)

- Persist campaign creation and listing.
- Enforce company ownership in business lists.
- Enforce published visibility for students.
- Prevent duplicate acceptance budget increments.
- Collect live-link proof and reported metrics.
- Aggregate proof statistics and record endorsements.

### Phase 2 — campaign integrity

- Add proof review decisions: submitted, needs changes, approved, rejected.
- Add payment reservation and release tied to approved proof.
- Add student identity joins to campaign detail instead of generic campaigner labels.
- Add real application/invitation management.
- Add media uploads for screenshots and campaign asset packs.
- Add campaign edit, pause, resume, close, and archive endpoints with ownership checks and audit logs.

### Phase 3 — connected accounts

- Add organization-scoped social connections and role permissions.
- Implement OAuth state storage, callbacks, encrypted tokens, refresh, disconnect, and health states.
- Start with one provider after obtaining credentials and review; do not build all providers simultaneously.
- Recommended first provider: YouTube for explicit upload/status semantics, or the provider for which Zumbarl can first obtain production approval.

### Phase 4 — studio, scheduling and analytics

- Platform-specific previews and validations.
- Approval workflow.
- Scheduled destination jobs.
- Publishing retries and status webhooks/polling.
- Provider metric snapshots and attribution labels.

## Admin-controlled feature tags

Navigation badges are platform configuration, not frontend constants.

- Super Admin → Config → Navigation feature tags controls the badge.
- Supported initial labels: New, Beta, Featured, Updated, or Hidden.
- The stored feature-flag key for Marketing is `navigation.business.marketing`.
- Changes are audited through the existing system-configuration audit flow.
- Business navigation reads `/api/v1/admin/navigation-feature-tags`; a disabled or empty tag renders no badge.

This mechanism should be reused for future navigation items rather than introducing new hard-coded badges.

## Acceptance checklist

- A newly created business campaign survives refresh and appears only to the owning business.
- Invalid campaign payloads surface an error instead of silently writing only to local storage.
- Draft campaigns are not listed to students.
- A student cannot reserve the same campaign payout twice.
- A campaign cannot exceed its budget through acceptances.
- Proof fields use the values entered by the student.
- Business metrics reflect persisted campaigns and proof, not fixture totals.
- An admin can show or hide the Marketing tag without a frontend deployment.
- No UI claims a social account is connected until OAuth and provider capability checks succeed.
