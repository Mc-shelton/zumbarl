# Managed entity profiles

## Product decision

Zumbarl accounts belong to people. During registration the person chooses a personal profile context—currently `Student` or `Professional`. A campus, club, association, or business never signs in directly. A registered user creates a page and becomes its owner, then grants `admin` or `editor` access to other registered users. This follows the managed-page pattern used by major professional and social networks while preserving a clear audit trail for every action.

A professional profile is not itself a business. It represents the individual using Zumbarl in a professional capacity. That person can create or manage one or more business pages, and a business page can be shared with other professionals or students without sharing credentials.

The public profile system is deliberately separate from the student profile. Shared infrastructure includes identity, handle, verification, contacts, managers, posts, events, media, and moderation. The content modules differ by entity type.

## Why these entities matter

Kenyatta University describes clubs and associations as places for social and intellectual interaction, career growth, links to industry and professional bodies, talent development, leadership, outreach, and welfare. Its governance requirements include registration, a constitution, a member register, elected officials, a staff patron, activity plans, and annual renewal. Sources: [KU clubs and societies](https://studentaffairs.ku.ac.ke/partnership/clubs-and-societies), [KU student handbook](https://admissions.ku.ac.ke/images/2024/student-information-handbook-2022-2026.pdf), and [KU student life](https://admissions.ku.ac.ke/images/2024/student_life_on_campus.pdf).

Campus profiles are the verified operational home for student services, facilities, student-life discovery, safety contacts, notices, and the directory of recognized organizations. They provide the trust anchor that verifies campus-linked pages.

Associations represent a defined constituency and emphasize welfare, advocacy, elections, accountability, partnerships, and student voice. KUSA’s stated mission and objectives include academic excellence, social welfare, employability, integrity, student rights, inclusion, arts, sports, alumni links, and community service. Sources: [KUSA mission](https://kusa.ku.ac.ke/mission-and-vision-2/) and [KUSA objectives](https://kusa.ku.ac.ke/objectives-2/).

Business profiles connect campus life to paid work, internships, projects, events, mentorship, and applied learning. University employer-engagement programs consistently combine recruitment with student projects, guest speakers, company visits, placements, and longer-term partnerships. Sources: [University of Exeter employer engagement](https://www.exeter.ac.uk/students/careers/employer-engagement/recruit/internships/), [Middlesex working with students](https://www.mdx.ac.uk/business-partnerships/working-with-our-students/), and [University of Sheffield partnerships](https://www.sheffield.ac.uk/management/partnerships).

## Public profile modules

### Campus

- Verified identity, branches, coordinates, website, and official contacts
- About, mission, key facts, schools/departments, and academic links
- Student services, health, safety, accessibility, and emergency contacts
- Facilities, maps, opening hours, and booking links
- Student life: clubs, associations, sports, arts, faith, and outreach
- Official announcements, events, opportunities, and important dates
- Directory of verified campus organizations

### Club

- Purpose, focus areas, campus affiliation, patron, and verification status
- Eligibility, membership status, fees, benefits, and join flow
- Constitution and policies
- Office bearers, committees, election cycle, and manager disclosure
- Meeting schedule and venue
- Events, projects, achievements, gallery, partners, and updates
- Member count and contact channels without exposing private member data

### Association

- Mandate, constituency, representation scope, and campus affiliation
- Welfare and advocacy areas
- Constitution, election cycle, leadership, committees, and accountability records
- Membership eligibility and chapter/region structure
- Services, cases or initiatives, partnerships, events, and notices
- Contact and escalation channels

### Business

- Verified company identity, industry, size, location, website, and trust status
- About, services/products, portfolio, and campus partnerships
- Paid gigs, internships, graduate roles, attachments, and student projects
- Events, mentorship, guest speaking, visits, and challenges
- Hiring activity, response signals, reviews, and payment/verification indicators
- Contact people and calls to follow, view opportunities, or propose a partnership

## Ownership and permissions

- `owner`: full control, manager access, transfer, publishing, and deletion/archive.
- `admin`: page editing, publishing, events, membership workflows, and manager invitations except ownership transfer.
- `editor`: content editing and publishing; no manager or ownership controls.
- Every mutation is authorized against `ManagedProfileManager`, never the public page type or the user’s global role alone.
- Owners and admins add an existing Zumbarl user by email. Pages never receive passwords or sessions.
- A campus page should be verified before it can verify affiliated clubs or associations.

## Data and routes

Core records are `ManagedProfile`, `ManagedProfileManager`, and the linked entity (`Campus`, `CommunityGroup`, or `Company`). `ConnectPost.managedProfileId` records which page authored a post.

- `POST /connect/managed-profiles` creates a page and its underlying entity where appropriate.
- `GET /connect/managed-profiles/me` lists pages available to the signed-in user.
- `GET /connect/managed-profiles/:id-or-slug` reads a public page.
- `PATCH /connect/managed-profiles/:id` updates a managed page.
- `POST /connect/managed-profiles/:id/posts` publishes as the page.
- `POST /connect/managed-profiles/:id/managers` grants access to an existing user.
- `DELETE /connect/managed-profiles/:id/managers/:userId` revokes non-owner access.

Public pages use `/campus/organizations/:slug`. Feed author links route organizations there while student authors continue to use `/campus/profiles/:studentId`.

## Rollout

1. Ship campus and verified organization profiles with the seeded Kenyatta University examples.
2. Add the “Your pages” switcher and guided page-creation forms.
3. Add membership applications, officer terms, verification, and campus approval.
4. Add page-authored stories, events, opportunity publishing, analytics, and audit history.
5. Add ownership transfer, manager invitations, recovery, and organization archiving.
