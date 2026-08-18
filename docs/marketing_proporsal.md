> This original proposal is retained for background. The maintained implementation and architecture specification is [marketing_system.md](./marketing_system.md), which separates creator campaigns from the future OAuth social-publishing studio.

Exactly. That is the correct model: each person logs into your platform, then **connects their own social accounts** and grants your system permission to publish for them.

They should **not give your system their Facebook, TikTok or Google passwords**. Instead, you use OAuth.

## User experience

Inside your platform:

```text
Connected accounts

[ Connect Facebook ]
[ Connect Instagram ]
[ Connect TikTok ]
[ Connect YouTube ]
[ Connect WhatsApp Business ]
```

When they click **Connect TikTok**, for example:

```text
Your platform
    ↓
Redirect to TikTok
    ↓
User logs into TikTok
    ↓
TikTok asks:
“Allow this application to publish content?”
    ↓
User approves
    ↓
TikTok redirects back to your platform
    ↓
Your system stores an access token
```

TikTok explicitly provides OAuth access-token management and a Content Posting API for apps that let users post to their TikTok profiles. ([TikTok for Developers][1])

The same principle applies to Google/YouTube: users authorize your application through Google OAuth, after which your backend can upload videos to their authorized channel. ([Google for Developers][2])

## Two different logins

Your platform will have two distinct authentication layers.

### 1. Login to your platform

For example:

```text
Email: user@example.com
Password: ********
```

This identifies the person using your application.

### 2. Connect social accounts

After logging into your platform, they connect:

```text
Facebook Page: Jabali Chorale
Instagram: @jabalichorale
TikTok: @jabalichorale
YouTube: Jabali Chorale
```

These connections are independent. A user might connect two Facebook Pages, three Instagram accounts and one YouTube channel.

## Your database structure

You could store the account connections like this:

```text
users
- id
- name
- email
- password_hash

social_connections
- id
- user_id
- platform
- external_user_id
- account_name
- access_token_encrypted
- refresh_token_encrypted
- expires_at
- scopes
- status
```

Example:

```json
{
  "userId": "USR-1024",
  "platform": "TIKTOK",
  "externalUserId": "72382938291",
  "accountName": "@jabalichorale",
  "accessTokenEncrypted": "...",
  "refreshTokenEncrypted": "...",
  "expiresAt": "2026-08-30T10:00:00Z",
  "status": "CONNECTED"
}
```

## Posting flow

When the user creates a post:

```text
Create post
   ↓
Select connected accounts
   ↓
Customize content per platform
   ↓
Publish now or schedule
   ↓
Backend creates one job per destination
```

For example:

```json
{
  "caption": "Join us for our November concert!",
  "mediaId": "MEDIA-9382",
  "destinations": [
    {
      "connectionId": "CONN-FB-01",
      "platform": "FACEBOOK"
    },
    {
      "connectionId": "CONN-IG-01",
      "platform": "INSTAGRAM"
    },
    {
      "connectionId": "CONN-TT-01",
      "platform": "TIKTOK"
    },
    {
      "connectionId": "CONN-YT-01",
      "platform": "YOUTUBE"
    }
  ]
}
```

Your backend then uses the token belonging to each connection.

```java
for (Destination destination : post.getDestinations()) {
    SocialConnection connection =
        connectionRepository.findById(destination.connectionId());

    SocialPublisher publisher =
        publisherRegistry.get(destination.platform());

    publisher.publish(post, connection);
}
```

## Facebook and Instagram considerations

For Facebook, the user usually authorizes your application and selects one or more **Facebook Pages** they manage. The Pages API supports publishing and other Page-management operations. ([Facebook Developers][3])

For Instagram, automated publishing is primarily for **professional accounts**, meaning Business or Creator accounts. Meta now supports Instagram Login as well as Facebook Login for eligible professional-account integrations. ([Facebook Developers][4])

Therefore, someone with only a standard personal Instagram account may need to switch it to a Creator or Business account before connecting it.

## TikTok may require a confirmation screen

TikTok places more emphasis on the creator being aware of what is being published. Your publishing interface may need to display:

```text
Posting to: @jabalichorale

Caption: November Concert
Privacy: Public
Allow comments: Yes
Allow Duet: Yes
Allow Stitch: No

[ Publish to TikTok ]
```

TikTok’s creator-info endpoint provides account-specific publishing capabilities, including privacy settings and the maximum video duration allowed for that creator. ([TikTok for Developers][5])

Depending on the integration and approval level, you may support either:

```text
Direct Post
```

or:

```text
Upload to TikTok inbox/drafts
User completes publishing in TikTok
```

TikTok documents both direct posting and upload flows; the upload flow can require the creator to finish editing and posting inside TikTok. ([TikTok for Developers][6])

## WhatsApp is different

For WhatsApp, users would normally connect a **WhatsApp Business account**, not an ordinary personal WhatsApp account.

The flow is more like:

```text
Connect Meta Business account
    ↓
Select WhatsApp Business Account
    ↓
Select registered phone number
    ↓
Grant messaging permissions
```

Then your platform sends messages to opted-in contacts. It does not publish a public WhatsApp post in the same way Instagram publishes a Reel.

WhatsApp Status is also not something you should assume can be published through the same general business-messaging integration. Treat WhatsApp primarily as a campaign and messaging destination.

## Account ownership model

Your system should support both individuals and organizations.

```text
Organization: Jabali Chorale

Members:
- Shellton — Owner
- Media Manager — Publisher
- Director — Approver

Connected accounts:
- Facebook Page
- Instagram
- TikTok
- YouTube
- WhatsApp Business
```

Then permissions can be:

```text
Owner
- Connect and disconnect accounts
- Manage users
- Publish
- Approve posts

Editor
- Create and edit drafts
- Cannot publish

Publisher
- Create and publish posts

Approver
- Approve or reject scheduled content
```

This prevents every team member from needing the passwords to the actual social-media accounts.

## Security requirements

Your system should:

* Encrypt access and refresh tokens.
* Store tokens only on the backend.
* Never expose access tokens in the browser.
* Use OAuth `state` values to prevent account-linking attacks.
* Request only the permissions needed.
* Allow users to disconnect accounts.
* Handle token expiry and revoked permissions.
* Maintain an audit trail of who published each post.
* Avoid logging tokens in application logs.

A useful connection status model would be:

```text
CONNECTED
TOKEN_EXPIRING
REAUTHENTICATION_REQUIRED
PERMISSION_REVOKED
DISCONNECTED
```

## Recommended screens

The platform could have these main areas:

```text
Social Accounts
- Connected accounts
- Account health
- Reconnect
- Disconnect

Content Studio
- Upload media
- Default caption
- Platform previews
- Hashtags
- Thumbnail
- Schedule

Calendar
- Drafts
- Scheduled posts
- Published posts
- Failed posts

Approvals
- Awaiting review
- Approved
- Rejected

Analytics
- Reach
- Views
- Engagement
- Delivery
- Clicks
```

So yes: users log into **your** application, connect and authorize **their own** social accounts, and your system becomes the interface they use to prepare, approve, schedule and publish content. That is essentially the same authorization model used by social-media management products.

[1]: https://developers.tiktok.com/doc/content-posting-api-reference-direct-post?enter_method=left_navigation&utm_source=chatgpt.com "TikTok Content Posting API Overview"
[2]: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps?utm_source=chatgpt.com "Using OAuth 2.0 for Web Server Applications | YouTube ..."
[3]: https://developers.facebook.com/documentation/pages-api?utm_source=chatgpt.com "Facebook Pages API - Meta for Developers"
[4]: https://developers.facebook.com/documentation/instagram-platform/overview?utm_source=chatgpt.com "Overview - Meta for Developers - Facebook"
[5]: https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info?enter_method=left_navigation&utm_source=chatgpt.com "Query Creator Info"
[6]: https://developers.tiktok.com/doc/content-posting-api-get-started?utm_source=chatgpt.com "Guide to Using the Content Posting API for TikTok"
