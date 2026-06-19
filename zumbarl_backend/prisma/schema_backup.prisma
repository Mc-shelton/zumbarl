// =============================================================================
// ZUMBARL — PRISMA SCHEMA
// Core tables only. Campus life, marketplace, and events schemas are separate.
// =============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =============================================================================
// ENUMS
// =============================================================================

enum UserRole {
  STUDENT_STANDARD
  STUDENT_TRANSITION
  STUDENT_ALUMNI
  CAMPUS_AMBASSADOR
  COMPANY_STANDARD
  COMPANY_PIPELINE_PARTNER
  COMPANY_HR_MANAGER
  COMPANY_HIRING_MANAGER
  COMPANY_VIEWER
  SAFETY_OFFICER
  OPERATIONS_MANAGER
  CAMPUS_MANAGER
  FINANCE_OFFICER
  CONTENT_MODERATOR
  SUPER_ADMIN
}

enum KycStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

enum GigStatus {
  DRAFT
  OPEN
  IN_PROGRESS
  SUBMITTED
  REVISION_REQUESTED
  COMPLETED
  DISPUTED
  CANCELLED
  EXPIRED
}

enum GigType {
  SOCIAL_MEDIA
  GRAPHIC_DESIGN
  COPYWRITING
  VIDEO
  DATA_ENTRY
  WEB_DEVELOPMENT
  SALES_MARKETING
  ERRAND
  TUTORING
  OTHER
}

enum GigMode {
  REMOTE
  PHYSICAL
  HYBRID
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}

enum PipelineStage {
  EXPLORE_FOUNDATION    // Stage 1
  BUILD_APPLY           // Stage 2
  GROW_SPECIALIZE       // Stage 3
  LEAD_IMPACT           // Stage 4
  ADVANCE_MENTOR        // Stage 5
}

enum PipelineRelationshipStatus {
  EARLY
  WARMING_UP
  ACTIVE
  PLACEMENT_READY
  PLACED
  INACTIVE
}

enum TransactionType {
  ESCROW_HOLD
  ESCROW_RELEASE
  ESCROW_REFUND
  STUDENT_PAYOUT
  PLATFORM_FEE
  CHAMA_CONTRIBUTION
  CHAMA_DISBURSEMENT
  CHAMA_INVESTMENT
  MICRO_ADVANCE
  ADVANCE_REPAYMENT
  COMPANY_PAYMENT
}

enum TransactionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REVERSED
}

enum MpesaDirection {
  STK_PUSH      // Company paying in
  B2C           // Student payout
  C2B           // Chama contribution
}

enum ScoreTier {
  BRONZE     // 0–24
  SILVER     // 25–74
  GOLD       // 75–89
  PLATINUM   // 90–100
}

enum SkillLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum SafetyReportType {
  FEELING_UNSAFE
  INAPPROPRIATE_BEHAVIOUR
  HARASSMENT
  FRAUD
  OTHER
}

enum SafetyReportStatus {
  RECEIVED
  UNDER_REVIEW
  RESOLVED
  ESCALATED
  CLOSED
}

enum PlacementType {
  INTERNSHIP
  ATTACHMENT
  FULL_TIME
  CONTRACT
}

// =============================================================================
// USERS & AUTH
// =============================================================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  studentEmail      String?   @unique  // university email
  phone             String    @unique
  passwordHash      String
  role              UserRole  @default(STUDENT_STANDARD)
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  studentProfile    StudentProfile?
  companyContact    CompanyContact?
  sessions          Session[]
  notifications     Notification[]
  sentMessages      Message[]        @relation("SentMessages")
  receivedMessages  Message[]        @relation("ReceivedMessages")

  @@index([email])
  @@index([phone])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  deviceInfo   String?
  ipAddress    String?
  expiresAt    DateTime
  revokedAt    DateTime?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
  @@map("sessions")
}

// =============================================================================
// STUDENT PROFILE
// =============================================================================

model StudentProfile {
  id                  String        @id @default(cuid())
  userId              String        @unique
  firstName           String
  lastName            String
  dateOfBirth         DateTime
  gender              String?
  locationCity        String        @default("Nairobi")
  avatarUrl           String?
  bio                 String?

  // Campus
  campusId            String
  courseId            String
  yearJoined          Int
  courseDuration      Int           // years
  expectedGraduation  DateTime
  studentIdNumber     String?

  // Career
  careerPath          String?       // e.g. "Marketing & Design"
  currentMode         String        @default("EARN") // EARN | CAREER

  // Transition
  transitionUnlockedAt DateTime?
  alumniWindowExpiresAt DateTime?
  isOpenToHire         Boolean      @default(false)

  // KYC
  kycStatus           KycStatus    @default(PENDING)
  kycVerifiedAt       DateTime?

  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  // Relations
  user                User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  campus              Campus       @relation(fields: [campusId], references: [id])
  course              Course       @relation(fields: [courseId], references: [id])
  kycDocuments        KycDocument[]
  zumbarl             ZumbarlScore?
  skillLevels         SkillLevel_[]
  gigApplications     GigApplication[]
  pipelineRelationships PipelineRelationship[]
  endorsementsReceived  Endorsement[] @relation("EndorsementsReceived")
  achievements        Achievement[]
  portfolioItems      PortfolioItem[]
  wallets             Wallet[]
  certificates        Certificate[]
  chamaMembers        ChamaMember[]

  @@index([campusId])
  @@index([kycStatus])
  @@map("student_profiles")
}

model Campus {
  id              String    @id @default(cuid())
  name            String
  branch          String?
  city            String
  latitude        Float?
  longitude       Float?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())

  students        StudentProfile[]
  campusManagers  CampusManager[]

  @@map("campuses")
}

model Course {
  id          String    @id @default(cuid())
  name        String
  category    String    // STEM | COMMERCE | ARTS | OTHER
  duration    Int       // years

  students    StudentProfile[]

  @@map("courses")
}

model KycDocument {
  id              String      @id @default(cuid())
  studentId       String
  documentType    String      // NATIONAL_ID | STUDENT_ID | CV | OTHER
  fileUrl         String      // signed R2 URL
  fileKey         String      // R2 object key
  status          KycStatus   @default(PENDING)
  reviewedAt      DateTime?
  reviewedBy      String?
  rejectionReason String?
  expiresAt       DateTime?
  createdAt       DateTime    @default(now())

  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@map("kyc_documents")
}

// =============================================================================
// COMPANY PROFILE
// =============================================================================

model Company {
  id                  String    @id @default(cuid())
  name                String
  registrationNumber  String?   @unique
  sector              String
  size                String    // MICRO | SMALL | MEDIUM | LARGE
  website             String?
  logoUrl             String?
  description         String?
  locationCity        String    @default("Nairobi")
  locationAddress     String?
  latitude            Float?
  longitude           Float?
  isPipelinePartner   Boolean   @default(false)
  hiringScore         Float?    // calculated from gig history
  kycStatus           KycStatus @default(PENDING)
  kycVerifiedAt       DateTime?
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  contacts            CompanyContact[]
  kycDocuments        CompanyKycDocument[]
  gigs                Gig[]
  pipelineRelationships PipelineRelationship[]
  endorsementsGiven   Endorsement[]   @relation("EndorsementsGiven")
  placements          Placement[]
  wallet              CompanyWallet?

  @@index([kycStatus])
  @@index([sector])
  @@map("companies")
}

model CompanyContact {
  id          String    @id @default(cuid())
  userId      String    @unique
  companyId   String
  jobTitle    String?
  isOwner     Boolean   @default(false)
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@map("company_contacts")
}

model CompanyKycDocument {
  id              String    @id @default(cuid())
  companyId       String
  documentType    String    // CERTIFICATE_OF_INCORPORATION | OWNER_ID | OTHER
  fileUrl         String
  fileKey         String
  status          KycStatus @default(PENDING)
  reviewedAt      DateTime?
  createdAt       DateTime  @default(now())

  company         Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@map("company_kyc_documents")
}

// =============================================================================
// GIGS
// =============================================================================

model Gig {
  id                  String      @id @default(cuid())
  companyId           String
  postedByContactId   String
  title               String
  description         String
  gigType             GigType
  gigMode             GigMode     @default(REMOTE)
  requiredSkills      String[]
  requiredTierMin     ScoreTier   @default(BRONZE)
  budgetMin           Float
  budgetMax           Float
  currency            String      @default("KES")
  deadline            DateTime
  estimatedHours      Float?
  locationCity        String?
  isPhysical          Boolean     @default(false)
  status              GigStatus   @default(DRAFT)
  maxApplicants       Int         @default(10)
  selectedStudentId   String?
  completedAt         DateTime?
  cancelledAt         DateTime?
  cancelReason        String?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  // Relations
  company             Company     @relation(fields: [companyId], references: [id])
  applications        GigApplication[]
  submission          GigSubmission?
  rating              GigRating?
  escrow              EscrowHold?
  safetyReports       SafetyReport[]

  @@index([companyId])
  @@index([status])
  @@index([gigType])
  @@index([deadline])
  @@map("gigs")
}

model GigApplication {
  id              String            @id @default(cuid())
  gigId           String
  studentId       String
  status          ApplicationStatus @default(PENDING)
  coverNote       String?
  appliedAt       DateTime          @default(now())
  respondedAt     DateTime?
  rejectionReason String?

  gig             Gig               @relation(fields: [gigId], references: [id], onDelete: Cascade)
  student         StudentProfile    @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([gigId, studentId])
  @@index([gigId])
  @@index([studentId])
  @@map("gig_applications")
}

model GigSubmission {
  id              String    @id @default(cuid())
  gigId           String    @unique
  studentId       String
  description     String?
  fileUrls        String[]
  fileKeys        String[]
  submittedAt     DateTime  @default(now())
  revisionCount   Int       @default(0)
  lastRevisionAt  DateTime?
  acceptedAt      DateTime?

  gig             Gig       @relation(fields: [gigId], references: [id], onDelete: Cascade)

  @@map("gig_submissions")
}

model GigRating {
  id                    String    @id @default(cuid())
  gigId                 String    @unique
  studentId             String
  companyId             String

  // Six dimensions — all 1.0 to 5.0
  communicationScore    Float
  timeManagementScore   Float
  skillsScore           Float
  deliveryQualityScore  Float
  creativityScore       Float
  professionalismScore  Float
  overallScore          Float     // computed average

  briefAdherence        Float     // 1–5: did work match the brief
  revisionCycles        Int       // how many revision rounds
  wouldHireAgain        Boolean
  publicFeedback        String?   // visible on student profile
  privateNote           String?   // company-only internal note
  isHeld                Boolean   @default(false) // held during safety review
  ratedAt               DateTime  @default(now())

  gig                   Gig       @relation(fields: [gigId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([companyId])
  @@map("gig_ratings")
}

// =============================================================================
// ZUMBARL SCORE
// =============================================================================

model ZumbarlScore {
  id                    String      @id @default(cuid())
  studentId             String      @unique
  currentScore          Float       @default(0)
  tier                  ScoreTier   @default(BRONZE)

  // Sub-scores (0–100 each)
  qualityScore          Float       @default(0)
  volumeScore           Float       @default(0)
  loyaltyScore          Float       @default(0)
  trustScore            Float       @default(0)
  deliveryScore         Float       @default(0)

  // Raw inputs for calculator
  avgRating             Float       @default(0)
  deliveryRate          Float       @default(0)
  totalGigsCompleted    Int         @default(0)
  repeatClientRate      Float       @default(0)
  endorsementCount      Int         @default(0)

  // Penalty flags
  deliveryPenaltyActive Boolean     @default(false)
  qualityGateActive     Boolean     @default(true) // true until 3 gigs done

  // Refresh cycle
  lastRefreshedAt       DateTime?
  nextRefreshAt         DateTime?
  refreshCycleDays      Int         @default(18)

  // Momentum
  previousScore         Float?
  scoreVelocity         Float?      // points per refresh cycle
  trendDirection        String?     // UP | FLAT | DOWN

  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  student               StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  snapshots             ScoreSnapshot[]

  @@map("zumbarl_scores")
}

model ScoreSnapshot {
  id              String    @id @default(cuid())
  scoreId         String
  studentId       String
  score           Float
  tier            ScoreTier
  qualityScore    Float
  volumeScore     Float
  loyaltyScore    Float
  trustScore      Float
  deliveryScore   Float
  snapshotReason  String    // REFRESH | GIG_COMPLETED | ENDORSEMENT | PENALTY
  createdAt       DateTime  @default(now())

  zumbarlScore    ZumbarlScore @relation(fields: [scoreId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@index([createdAt])
  @@map("score_snapshots")
}

model SkillLevel_ {
  id              String      @id @default(cuid())
  studentId       String
  skillName       String
  level           SkillLevel  @default(BEGINNER)
  verifiedByGigs  Int         @default(0)
  lastAdvancedAt  DateTime?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([studentId, skillName])
  @@index([studentId])
  @@map("skill_levels")
}

model Endorsement {
  id              String    @id @default(cuid())
  studentId       String
  companyId       String
  endorsedByName  String
  endorsedByTitle String
  note            String?
  currencyAwarded Int       @default(12) // EC points
  gigId           String?   // the gig that triggered this
  createdAt       DateTime  @default(now())

  student         StudentProfile @relation("EndorsementsReceived", fields: [studentId], references: [id], onDelete: Cascade)
  company         Company        @relation("EndorsementsGiven", fields: [companyId], references: [id])

  @@index([studentId])
  @@index([companyId])
  @@map("endorsements")
}

model Achievement {
  id              String    @id @default(cuid())
  studentId       String
  type            String    // STAGE_ADVANCE | TOP_RATED | STREAK | FIRST_GIG | etc.
  title           String
  description     String
  iconKey         String?
  earnedAt        DateTime  @default(now())

  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@map("achievements")
}

// =============================================================================
// PIPELINE & CAREER
// =============================================================================

model PipelineRelationship {
  id              String                      @id @default(cuid())
  studentId       String
  companyId       String
  status          PipelineRelationshipStatus  @default(EARLY)
  gigsCompleted   Int                         @default(0)
  avgRatingGiven  Float?
  isFlagged       Boolean                     @default(false) // company flagged student as pipeline candidate
  flaggedAt       DateTime?
  notes           String?                     // company internal note
  readinessScore  Float?                      // role-specific fit score
  targetRole      String?
  createdAt       DateTime                    @default(now())
  updatedAt       DateTime                    @updatedAt

  student         StudentProfile              @relation(fields: [studentId], references: [id], onDelete: Cascade)
  company         Company                     @relation(fields: [companyId], references: [id])

  @@unique([studentId, companyId])
  @@index([studentId])
  @@index([companyId])
  @@map("pipeline_relationships")
}

model CareerStageProgress {
  id                  String          @id @default(cuid())
  studentId           String
  stage               PipelineStage
  status              String          @default("LOCKED") // LOCKED | IN_PROGRESS | COMPLETED
  progressPercent     Float           @default(0)
  projectsCompleted   Int             @default(0)
  companiesWorkedWith Int             @default(0)
  startedAt           DateTime?
  completedAt         DateTime?
  createdAt           DateTime        @default(now())
  updatedAt           DateTime        @updatedAt

  @@unique([studentId, stage])
  @@index([studentId])
  @@map("career_stage_progress")
}

model PortfolioItem {
  id              String    @id @default(cuid())
  studentId       String
  gigId           String?
  title           String
  description     String
  category        String    // mirrors GigType
  thumbnailUrl    String?
  fileUrls        String[]
  companyName     String?
  clientFeedback  String?
  isFeatured      Boolean   @default(false)
  isPublic        Boolean   @default(true)

  // Impact metrics (student-inputted, company-verified flag)
  impactMetrics   Json?     // { label: string, value: string }[]
  metricsVerified Boolean   @default(false)

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  student         StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@map("portfolio_items")
}

model Placement {
  id              String        @id @default(cuid())
  studentId       String
  companyId       String
  type            PlacementType
  role            String
  startDate       DateTime
  endDate         DateTime?
  salaryOffered   Float?
  isLocked        Boolean       @default(true)  // student can't seek other placements
  offeredAt       DateTime      @default(now())
  acceptedAt      DateTime?
  declinedAt      DateTime?
  completedAt     DateTime?
  platformFee     Float?

  company         Company       @relation(fields: [companyId], references: [id])

  @@index([studentId])
  @@index([companyId])
  @@map("placements")
}

model Certificate {
  id                  String    @id @default(cuid())
  studentId           String
  type                String    // SKILL_VERIFIED | TIER_ACHIEVED | ZUMBARL_GRADUATE
  title               String
  skillName           String?
  level               String?
  fileUrl             String?   // signed PDF URL
  fileKey             String?
  verificationHash    String?   @unique  // tamper-evident
  issuedAt            DateTime  @default(now())
  expiresAt           DateTime?

  student             StudentProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
  @@map("certificates")
}

// =============================================================================
// FINANCE
// =============================================================================

model Wallet {
  id              String    @id @default(cuid())
  studentId       String
  type            String    @default("MAIN") // MAIN | SAVINGS
  balance         Float     @default(0)
  pendingBalance  Float     @default(0)      // in escrow, not yet released
  currency        String    @default("KES")
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  student         StudentProfile  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  transactions    Transaction[]

  @@index([studentId])
  @@map("wallets")
}

model CompanyWallet {
  id          String    @id @default(cuid())
  companyId   String    @unique
  balance     Float     @default(0)
  currency    String    @default("KES")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  company     Company       @relation(fields: [companyId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("company_wallets")
}

model Transaction {
  id                String            @id @default(cuid())
  walletId          String?
  companyWalletId   String?
  chamaWalletId     String?
  type              TransactionType
  status            TransactionStatus @default(PENDING)
  amount            Float
  currency          String            @default("KES")
  platformFee       Float             @default(0)
  netAmount         Float             // amount - platformFee
  reference         String            @unique @default(cuid())
  mpesaRef          String?           // Safaricom transaction ID
  mpesaDirection    MpesaDirection?
  description       String?
  gigId             String?
  metadata          Json?             // flexible extra data
  processedAt       DateTime?
  failedAt          DateTime?
  failureReason     String?
  createdAt         DateTime          @default(now())

  wallet            Wallet?           @relation(fields: [walletId], references: [id])
  companyWallet     CompanyWallet?    @relation(fields: [companyWalletId], references: [id])
  chamaWallet       ChamaWallet?      @relation(fields: [chamaWalletId], references: [id])

  @@index([walletId])
  @@index([companyWalletId])
  @@index([gigId])
  @@index([status])
  @@index([createdAt])
  @@map("transactions")
}

model EscrowHold {
  id              String            @id @default(cuid())
  gigId           String            @unique
  companyId       String
  studentId       String
  amount          Float
  currency        String            @default("KES")
  status          String            @default("HELD") // HELD | RELEASED | REFUNDED | DISPUTED
  heldAt          DateTime          @default(now())
  releasedAt      DateTime?
  refundedAt      DateTime?
  transactionRef  String?

  gig             Gig               @relation(fields: [gigId], references: [id])

  @@index([companyId])
  @@index([studentId])
  @@map("escrow_holds")
}

model MicroAdvance {
  id              String    @id @default(cuid())
  studentId       String
  gigId           String    // the gig whose payout backs this advance
  amount          Float
  currency        String    @default("KES")
  status          String    @default("ACTIVE") // ACTIVE | REPAID | DEFAULTED
  issuedAt        DateTime  @default(now())
  repaidAt        DateTime?
  repaymentRef    String?

  @@index([studentId])
  @@index([gigId])
  @@map("micro_advances")
}

// =============================================================================
// CHAMAS (GROUP SAVINGS)
// =============================================================================

model Chama {
  id                  String    @id @default(cuid())
  name                String
  description         String?
  campusId            String
  contributionPercent Float     @default(10) // % of each gig payout
  isActive            Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  members             ChamaMember[]
  wallet              ChamaWallet?
  whitelistedPayees   ChamaWhitelistedPayee[]

  @@index([campusId])
  @@map("chamas")
}

model ChamaMember {
  id              String    @id @default(cuid())
  chamaId         String
  studentId       String
  isAdmin         Boolean   @default(false)
  totalContributed Float    @default(0)
  joinedAt        DateTime  @default(now())

  chama           Chama           @relation(fields: [chamaId], references: [id], onDelete: Cascade)
  student         StudentProfile  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@unique([chamaId, studentId])
  @@index([chamaId])
  @@index([studentId])
  @@map("chama_members")
}

model ChamaWallet {
  id          String    @id @default(cuid())
  chamaId     String    @unique
  balance     Float     @default(0)
  currency    String    @default("KES")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  chama       Chama         @relation(fields: [chamaId], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("chama_wallets")
}

model ChamaWhitelistedPayee {
  id          String    @id @default(cuid())
  chamaId     String
  name        String
  phone       String
  type        String    // LANDLORD | HOSTEL | SUPPLIER | MEMBER | OTHER
  addedBy     String
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())

  chama       Chama     @relation(fields: [chamaId], references: [id], onDelete: Cascade)

  @@index([chamaId])
  @@map("chama_whitelisted_payees")
}

// =============================================================================
// SAFETY (SILOED — no foreign key references to this from other services)
// =============================================================================

model SafetyReport {
  id              String              @id @default(cuid())
  reporterUserId  String              // not a FK — siloed by design
  reportedEntity  String              // company ID or user ID
  entityType      String              // COMPANY | USER
  gigId           String?             // gig context if applicable
  type            SafetyReportType
  status          SafetyReportStatus  @default(RECEIVED)
  description     String?
  locationLat     Float?
  locationLng     Float?
  isAnonymous     Boolean             @default(false)
  assignedTo      String?             // safety officer user ID
  resolvedAt      DateTime?
  resolution      String?
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Soft link to gig — not a hard FK to preserve silo
  gig             Gig?    @relation(fields: [gigId], references: [id])

  @@index([reporterUserId])
  @@index([status])
  @@map("safety_reports")
}

// =============================================================================
// NOTIFICATIONS & MESSAGING
// =============================================================================

model Notification {
  id          String    @id @default(cuid())
  userId      String
  type        String    // GIG_MATCH | SCORE_REFRESH | ENDORSEMENT | SAFETY | etc.
  title       String
  body        String
  data        Json?     // deep link data
  isRead      Boolean   @default(false)
  readAt      DateTime?
  sentVia     String[]  // IN_APP | WHATSAPP | SMS | EMAIL
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

model Message {
  id              String    @id @default(cuid())
  gigId           String?
  senderId        String
  recipientId     String
  body            String
  fileUrls        String[]
  isRead          Boolean   @default(false)
  readAt          DateTime?
  createdAt       DateTime  @default(now())

  sender          User      @relation("SentMessages", fields: [senderId], references: [id])
  recipient       User      @relation("ReceivedMessages", fields: [recipientId], references: [id])

  @@index([gigId])
  @@index([senderId])
  @@index([recipientId])
  @@map("messages")
}

// =============================================================================
// PLATFORM ADMIN
// =============================================================================

model CampusManager {
  id        String    @id @default(cuid())
  userId    String    @unique
  campusId  String
  createdAt DateTime  @default(now())

  campus    Campus    @relation(fields: [campusId], references: [id])

  @@map("campus_managers")
}

model AuditLog {
  id          String    @id @default(cuid())
  userId      String
  action      String
  entityType  String
  entityId    String
  before      Json?
  after       Json?
  ipAddress   String?
  createdAt   DateTime  @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

// =============================================================================
// API WORKFLOW RECORDS
// =============================================================================

model AppRecord {
  id          String   @id @default(cuid())
  collection  String
  data        Json
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([collection])
  @@index([collection, createdAt])
  @@map("app_records")
}
