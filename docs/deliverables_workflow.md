# Zumbarl | Gig Deliverables Framework

**Confidential — Zumbarl Internal Document**
**Version 1.0 | June 2026**

# ZUMBARL

## The Ecosystem for Campus Talent

# Gig Deliverables Framework

### Submission Types, Verification Methods, and Platform Rules

---

# Introduction

Zumbarl connects students to companies through project-based gigs. Because gigs span a wide range of work types — from poster design to software development to physical errands — a single submission flow cannot serve all of them well.

This document defines six deliverable types used across the platform. Each type has its own submission method, verification approach, and payment release logic.

Getting this right matters for three reasons:

* Students need to know exactly what to submit and how before they accept a gig.
* Companies need confidence that what they receive can be independently verified — not just self-reported.
* Zumbarl needs a consistent, enforceable framework that protects both sides and reduces disputes.

The six deliverable types are:

1. Type 1 — File Asset Deliverables
2. Type 2 — Code & Development Deliverables
3. Type 3 — Document Deliverables
4. Type 4 — Stats & Metrics Deliverables
5. Type 5 — Proof-Based Deliverables
6. Type 6 — Hybrid Deliverables

> **Core Principle:** All deliverable requirements and payment splits must be defined in the brief before the student accepts. No new requirements can be added after acceptance. Any addition is treated as scope creep and is a reportable dispute.

---

# Type 1 — File Asset Deliverables

File asset deliverables are visual or audio outputs that the student creates and uploads directly. The deliverable is the file itself.

## Gig Types Covered

* Poster and graphic design
* Logo creation and brand identity
* Social media graphics and templates
* Video editing and production
* Photography and image editing
* UI mockups and wireframes
* Branding packs and style guides

## Submission Method

| Element          | Detail                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Upload method    | Direct upload to Zumbarl (max 50MB per file, 10 files per submission)                                    |
| Accepted formats | PNG, JPG, PDF, SVG, MP4, MOV, AI, PSD, Figma share link, Canva share link                                |
| Link previews    | Figma and Canva links auto-preview in submission panel                                                   |
| Source files     | For gigs above KSh 5,000, companies may require PSD, AI, or Figma source files if specified in the brief |

## Verification Method

* Company review and approval
* Reverse image originality check
* Revision cycle tracking

## Platform Rules

### Watermark Rule

Students may not watermark deliverables submitted for escrow-backed gigs.

Watermarking is treated as a trust violation and triggers a score penalty.

---

# Type 2 — Code & Development Deliverables

Code and development deliverables are technical outputs — websites, apps, scripts, automations, data pipelines.

The deliverable must be runnable or deployable, not merely a set of files.

## Gig Types Covered

* Website development
* App features and bug fixes
* Scripts and workflow automation
* Data pipelines
* API integrations
* WordPress and CMS setup
* Data analysis and visualisation

## Submission Method

| Element              | Detail                 |
| -------------------- | ---------------------- |
| Primary method       | GitHub repository link |
| Secondary method     | Deployed live URL      |
| Fallback             | ZIP upload             |
| Recommended addition | Loom walkthrough video |

## Verification Method

* Auto-generated brief adherence checklist
* GitHub commit history review
* Live demo verification

## IP and Ownership

Ownership transfers to the company upon escrow release **only if the brief explicitly states IP transfer**.

Otherwise ownership remains with the student.

---

# Type 3 — Document Deliverables

Document deliverables are written outputs including articles, reports, scripts, and proposals.

## Gig Types Covered

* Blog articles
* Copywriting
* Scripts
* Business reports
* Grant writing
* Ebooks
* Proofreading and editing

## Submission Method

| Element          | Detail                             |
| ---------------- | ---------------------------------- |
| Preferred method | Google Docs share link             |
| Accepted formats | Google Docs, DOCX, PDF             |
| Word count       | Auto-validated against brief range |
| Revision flow    | Tracked changes and comments       |

## Verification Method

### Plagiarism Check

Similarity score above 20% triggers manual review.

### AI Content Detection

Shown as an indicator to companies, not an automatic blocker.

### Edit History Verification

Google Docs edit history must demonstrate genuine authorship.

## Platform Rules

AI-assisted writing policies must be defined before gig start.

If the brief specifies **No AI**, AI-generated submissions may trigger disputes and score penalties.

---

# Type 4 — Stats & Metrics Deliverables

Stats deliverables measure outcomes rather than files.

Examples include follower growth, engagement, reach, and lead generation.

## Gig Types Covered

* Social media management
* WhatsApp channel mentions
* Influencer posts
* Lead generation
* Sales campaigns
* Community growth
* Email campaigns

## Mandatory Brief Requirements

* Specific metric target
* Measurement window
* Baseline metric
* Measurement method
* Accepted evidence format

## Verification Method

### Platform Analytics Screenshots

Students submit before-and-after screenshots from:

* Instagram Insights
* TikTok Analytics
* WhatsApp Channel Analytics

### Zumbarl Channel Verification

For WhatsApp channel gigs:

* Student adds Zumbarl admin account
* Platform directly verifies reach and activity

### API Verification

Where APIs are available:

* Reach
* Impressions
* Engagement

are verified directly from platform APIs.

### Split Payment Model

Stats gigs may use:

* 50% on content delivery
* 50% on verified metric achievement

This must be agreed within the brief.

## Platform Rules

Buying followers, fake engagement, bot traffic, or fraudulent screenshots result in:

* Permanent platform ban
* Payment hold
* Manual review

---

# Type 5 — Proof-Based Deliverables

Proof-based deliverables verify physical-world activity.

## Gig Types Covered

* Deliveries
* In-person sales visits
* Event attendance
* Surveys
* Mystery shopping
* Printing pickup
* Campus errands

## Submission Method

| Element               | Detail                               |
| --------------------- | ------------------------------------ |
| Geo-tagged photo      | Captured in-app with EXIF validation |
| GPS check-in          | Required within 200m of location     |
| WhatsApp confirmation | Recipient confirms completion        |
| Milestone flow        | Sequential timestamped stages        |

## Advance Disbursement Gate

Students must have sufficient wallet balance to cover transport costs before accepting qualifying gigs.

## Safety Requirements

For gigs after 8pm or at unverified locations:

1. Company must be fully KYC verified.
2. Student must enable live location sharing with a trusted contact.

Neither requirement can be waived.

---

# Type 6 — Hybrid Deliverables

Hybrid deliverables combine multiple deliverable types.

## Common Combinations

| Combination     | Example                           |
| --------------- | --------------------------------- |
| Type 1 + Type 4 | Social posts + engagement metrics |
| Type 2 + Type 3 | Website + copywriting             |
| Type 5 + Type 4 | Sales visits + CRM logging        |
| Type 3 + Type 5 | Blog writing + publishing proof   |
| Type 1 + Type 3 | Pitch deck + presentation script  |

## Hybrid Brief Structure

### Component Selector

Companies choose required deliverable types.

The platform builds submission workflows automatically.

### Payment Milestone Builder

Each component receives a payment percentage.

All percentages must total 100%.

### Staged Escrow Release

Payments release as milestones are approved.

### Sequential Submission Lock

Students cannot submit later stages until earlier stages are approved.

## Example: Social Media Gig

| Stage   | Requirement                   | Payment |
| ------- | ----------------------------- | ------- |
| Stage 1 | Create 4 branded social posts | 40%     |
| Stage 2 | Submit proof of posting       | 30%     |
| Stage 3 | Submit engagement analytics   | 30%     |

All stages and payment splits must be defined before acceptance.

---

# Deliverable Type Matrix

| Deliverable Type   | File Upload | Link | GPS Proof   | Screenshot  | API Verify  | Staged Pay | Plagiarism  | Dispute Protection |
| ------------------ | ----------- | ---- | ----------- | ----------- | ----------- | ---------- | ----------- | ------------------ |
| File Assets        | ✓           | ✓    | —           | —           | —           | —          | ✓           | ✓                  |
| Code & Development | ✓           | ✓    | —           | —           | —           | ✓          | —           | ✓                  |
| Documents          | ✓           | ✓    | —           | —           | —           | —          | ✓           | ✓                  |
| Stats & Metrics    | —           | —    | —           | ✓           | ✓           | ✓          | —           | ✓                  |
| Proof-Based        | —           | —    | ✓           | ✓           | —           | ✓          | —           | ✓                  |
| Hybrid             | ✓           | ✓    | Conditional | Conditional | Conditional | ✓          | Conditional | ✓                  |

---

# Dispute Resolution Framework

Zumbarl acts as a neutral intermediary and enforces the brief rather than subjective quality judgments.

## General Principles

### The Brief Is The Contract

Disputes are judged against the brief.

### Scope Creep Is Automatically A Dispute

New requirements added after acceptance are not enforceable.

### Evidence Wins

Examples:

* GitHub commits
* GPS logs
* Analytics data
* Timestamped submissions

### Revision Limits Apply

Additional revisions beyond agreed limits may require additional payment.

---

# Escalation Path

| Stage                     | What Happens                                |
| ------------------------- | ------------------------------------------- |
| 1 — Student flags         | Concern or revision request raised          |
| 2 — Platform holds escrow | Funds frozen during review                  |
| 3 — Ops review            | Brief, evidence, and communication reviewed |
| 4 — Resolution            | Escrow released, refunded, or split         |
| 5 — Score impact          | Reliability scores updated                  |

---

# Zumbarl — The Ecosystem for Campus Talent

**Confidential — Internal Use Only**
