-- CreateEnum
CREATE TYPE "EvergreenProgramStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'CHANGES_REQUESTED', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EvergreenCohortStatus" AS ENUM ('SCHEDULED', 'OPEN', 'MATCHING', 'INTERVIEWING', 'FILLED', 'PARTIALLY_FILLED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvergreenCandidateStatus" AS ENUM ('MATCHED', 'INVITED', 'APPLIED', 'SHORTLISTED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'STARTED', 'COMPLETED', 'DECLINED', 'WITHDRAWN', 'REJECTED', 'OFFER_EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "EvergreenOfferStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('PENDING_ONBOARDING', 'READY', 'ACTIVE', 'COMPLETION_REVIEW', 'COMPLETED', 'DEFERRED', 'CANCELLED_BEFORE_START', 'TERMINATED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "EvergreenWorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "EvergreenRecurrenceType" AS ENUM ('NONE', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EvergreenEntitlementStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EvergreenInvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'CONFIRMED', 'REFUNDED', 'VOID');

-- CreateEnum
CREATE TYPE "EvergreenOverrideStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EvergreenMatchRunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PlacementEvidenceStatus" AS ENUM ('SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'DEAD_LETTER');

-- DropIndex
DROP INDEX "placements_companyId_idx";

-- DropIndex
DROP INDEX "placements_studentId_idx";

-- AlterTable
ALTER TABLE "placements" ADD COLUMN     "candidateId" TEXT,
ADD COLUMN     "cohortId" TEXT,
ADD COLUMN     "completionSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'KES',
ADD COLUMN     "duties" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "lockReleasedAt" TIMESTAMP(3),
ADD COLUMN     "offerId" TEXT,
ADD COLUMN     "programId" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "PlacementStatus" NOT NULL DEFAULT 'PENDING_ONBOARDING',
ADD COLUMN     "stipendAmount" DECIMAL(14,2),
ADD COLUMN     "stipendFrequency" TEXT,
ADD COLUMN     "supervisorId" TEXT,
ADD COLUMN     "terminatedAt" TIMESTAMP(3),
ADD COLUMN     "terminationReason" TEXT,
ADD COLUMN     "termsSnapshot" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "workMode" "EvergreenWorkMode";

ALTER TABLE "placements" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "evergreen_programs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "placementType" "PlacementType" NOT NULL,
    "workMode" "EvergreenWorkMode" NOT NULL,
    "location" TEXT,
    "durationWeeks" INTEGER NOT NULL,
    "defaultSeatCount" INTEGER NOT NULL,
    "stipendAmount" DECIMAL(14,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KES',
    "stipendFrequency" TEXT,
    "supervisionPlan" TEXT NOT NULL,
    "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recurrenceType" "EvergreenRecurrenceType" NOT NULL DEFAULT 'NONE',
    "recurrenceRule" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "status" "EvergreenProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "riskLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "pipelineOptIn" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evergreen_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_program_skills" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evergreen_program_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_program_competencies" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "minimumScore" INTEGER NOT NULL DEFAULT 70,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "evergreen_program_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_program_supervisors" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evergreen_program_supervisors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_cohorts" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "applicationOpensAt" TIMESTAMP(3) NOT NULL,
    "applicationClosesAt" TIMESTAMP(3) NOT NULL,
    "interviewStartsAt" TIMESTAMP(3),
    "interviewEndsAt" TIMESTAMP(3),
    "offerDeadlineAt" TIMESTAMP(3),
    "placementStartsAt" TIMESTAMP(3) NOT NULL,
    "placementEndsAt" TIMESTAMP(3) NOT NULL,
    "seatCount" INTEGER NOT NULL,
    "reservedSeats" INTEGER NOT NULL DEFAULT 0,
    "filledSeats" INTEGER NOT NULL DEFAULT 0,
    "status" "EvergreenCohortStatus" NOT NULL DEFAULT 'SCHEDULED',
    "recurrenceSource" TEXT,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evergreen_cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_candidates" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "EvergreenCandidateStatus" NOT NULL DEFAULT 'MATCHED',
    "matchScore" DECIMAL(6,3),
    "matchVersion" TEXT,
    "matchReasons" JSONB,
    "eligibilitySnapshot" JSONB,
    "consentSnapshot" JSONB NOT NULL,
    "privateNotes" TEXT,
    "lastActorId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evergreen_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_availability" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isSeeking" BOOLEAN NOT NULL DEFAULT false,
    "placementTypes" "PlacementType"[],
    "earliestStartDate" TIMESTAMP(3),
    "latestStartDate" TIMESTAMP(3),
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workModes" "EvergreenWorkMode"[],
    "roleInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weeklyAvailability" JSONB,
    "consentVersion" TEXT NOT NULL,
    "companyVisibleFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "visibleFrom" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_offers" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "role" TEXT NOT NULL,
    "duties" TEXT NOT NULL,
    "placementType" "PlacementType" NOT NULL,
    "workMode" "EvergreenWorkMode" NOT NULL,
    "location" TEXT,
    "stipendAmount" DECIMAL(14,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KES',
    "stipendFrequency" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "termsSnapshot" JSONB NOT NULL,
    "status" "EvergreenOfferStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondBy" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "declineReason" TEXT,
    "replacementOfferId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_placement_locks" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "acquiredFromOfferId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "active_placement_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_onboarding_items" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_onboarding_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_goals" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "competencyId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_check_ins" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "periodStartsAt" TIMESTAMP(3) NOT NULL,
    "periodEndsAt" TIMESTAMP(3) NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "studentReflection" TEXT,
    "studentSubmittedAt" TIMESTAMP(3),
    "supervisorResponse" TEXT,
    "supervisorRespondedAt" TIMESTAMP(3),
    "riskFlag" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DUE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_evidence" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "goalId" TEXT,
    "competencyId" TEXT,
    "submittedById" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "artifactReference" TEXT NOT NULL,
    "status" "PlacementEvidenceStatus" NOT NULL DEFAULT 'SUBMITTED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "roadmapEvidenceId" TEXT,
    "portfolioItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_evaluations" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "evaluatorType" TEXT NOT NULL,
    "rubricScores" JSONB NOT NULL,
    "narrative" TEXT NOT NULL,
    "recommendation" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'SHARED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_amendments" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "proposedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "studentAcceptedAt" TIMESTAMP(3),
    "companyAcceptedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_status_events" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "fromStatus" "PlacementStatus",
    "toStatus" "PlacementStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_support_requests" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "privateDetails" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assignedToId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "placement_support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_entitlements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sourceInvoiceId" TEXT,
    "planCode" TEXT NOT NULL,
    "status" "EvergreenEntitlementStatus" NOT NULL DEFAULT 'PENDING',
    "programLimit" INTEGER NOT NULL,
    "seatLimit" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evergreen_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'KES',
    "status" "EvergreenInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "externalReference" TEXT,
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "confirmedById" TEXT,
    "refundedAt" TIMESTAMP(3),
    "refundReason" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evergreen_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_overrides" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT NOT NULL,
    "status" "EvergreenOverrideStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evergreen_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_match_runs" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "algorithmVersion" TEXT NOT NULL,
    "inputSnapshot" JSONB NOT NULL,
    "status" "EvergreenMatchRunStatus" NOT NULL DEFAULT 'PENDING',
    "eligibleCount" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evergreen_match_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_mentorship_alternatives" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "evidence" JSONB,
    "approvedById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evergreen_mentorship_alternatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT NOT NULL,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "claimedBy" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_idempotency_keys" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseCode" INTEGER,
    "responseBody" JSONB,
    "resourceId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "evergreen_idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evergreen_worker_leases" (
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evergreen_worker_leases_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "evergreen_job_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "replayOfId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "result" JSONB,
    "failureReason" TEXT,
    "requestedById" TEXT,

    CONSTRAINT "evergreen_job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flags" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "config" JSONB,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "evergreen_programs_companyId_status_idx" ON "evergreen_programs"("companyId", "status");

-- CreateIndex
CREATE INDEX "evergreen_programs_status_createdAt_idx" ON "evergreen_programs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "evergreen_program_skills_skillId_idx" ON "evergreen_program_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_program_skills_programId_skillId_key" ON "evergreen_program_skills"("programId", "skillId");

-- CreateIndex
CREATE INDEX "evergreen_program_competencies_competencyId_idx" ON "evergreen_program_competencies"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_program_competencies_programId_competencyId_key" ON "evergreen_program_competencies"("programId", "competencyId");

-- CreateIndex
CREATE INDEX "evergreen_program_supervisors_supervisorId_idx" ON "evergreen_program_supervisors"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_program_supervisors_programId_supervisorId_key" ON "evergreen_program_supervisors"("programId", "supervisorId");

-- CreateIndex
CREATE INDEX "evergreen_cohorts_status_applicationOpensAt_idx" ON "evergreen_cohorts"("status", "applicationOpensAt");

-- CreateIndex
CREATE INDEX "evergreen_cohorts_programId_status_idx" ON "evergreen_cohorts"("programId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_cohorts_programId_sequenceNumber_key" ON "evergreen_cohorts"("programId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "evergreen_candidates_cohortId_status_createdAt_idx" ON "evergreen_candidates"("cohortId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "evergreen_candidates_studentId_status_idx" ON "evergreen_candidates"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_candidates_cohortId_studentId_key" ON "evergreen_candidates"("cohortId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "placement_availability_studentId_key" ON "placement_availability"("studentId");

-- CreateIndex
CREATE INDEX "placement_availability_isSeeking_expiresAt_idx" ON "placement_availability"("isSeeking", "expiresAt");

-- CreateIndex
CREATE INDEX "placement_offers_candidateId_status_idx" ON "placement_offers"("candidateId", "status");

-- CreateIndex
CREATE INDEX "placement_offers_studentId_status_respondBy_idx" ON "placement_offers"("studentId", "status", "respondBy");

-- CreateIndex
CREATE INDEX "placement_offers_companyId_status_idx" ON "placement_offers"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_offers_companyId_idempotencyKey_key" ON "placement_offers"("companyId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "active_placement_locks_studentId_key" ON "active_placement_locks"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "active_placement_locks_placementId_key" ON "active_placement_locks"("placementId");

-- CreateIndex
CREATE UNIQUE INDEX "active_placement_locks_acquiredFromOfferId_key" ON "active_placement_locks"("acquiredFromOfferId");

-- CreateIndex
CREATE INDEX "placement_onboarding_items_placementId_completedAt_idx" ON "placement_onboarding_items"("placementId", "completedAt");

-- CreateIndex
CREATE INDEX "placement_goals_placementId_status_idx" ON "placement_goals"("placementId", "status");

-- CreateIndex
CREATE INDEX "placement_goals_competencyId_idx" ON "placement_goals"("competencyId");

-- CreateIndex
CREATE INDEX "placement_check_ins_status_dueAt_idx" ON "placement_check_ins"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "placement_check_ins_placementId_periodStartsAt_key" ON "placement_check_ins"("placementId", "periodStartsAt");

-- CreateIndex
CREATE INDEX "placement_evidence_placementId_status_idx" ON "placement_evidence"("placementId", "status");

-- CreateIndex
CREATE INDEX "placement_evidence_competencyId_idx" ON "placement_evidence"("competencyId");

-- CreateIndex
CREATE INDEX "placement_evaluations_placementId_idx" ON "placement_evaluations"("placementId");

-- CreateIndex
CREATE UNIQUE INDEX "placement_evaluations_placementId_evaluatorId_evaluatorType_key" ON "placement_evaluations"("placementId", "evaluatorId", "evaluatorType");

-- CreateIndex
CREATE INDEX "placement_amendments_placementId_status_idx" ON "placement_amendments"("placementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "placement_amendments_placementId_version_key" ON "placement_amendments"("placementId", "version");

-- CreateIndex
CREATE INDEX "placement_status_events_placementId_createdAt_idx" ON "placement_status_events"("placementId", "createdAt");

-- CreateIndex
CREATE INDEX "placement_support_requests_placementId_status_idx" ON "placement_support_requests"("placementId", "status");

-- CreateIndex
CREATE INDEX "placement_support_requests_status_createdAt_idx" ON "placement_support_requests"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_entitlements_sourceInvoiceId_key" ON "evergreen_entitlements"("sourceInvoiceId");

-- CreateIndex
CREATE INDEX "evergreen_entitlements_companyId_status_validUntil_idx" ON "evergreen_entitlements"("companyId", "status", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_invoices_invoiceNumber_key" ON "evergreen_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_invoices_idempotencyKey_key" ON "evergreen_invoices"("idempotencyKey");

-- CreateIndex
CREATE INDEX "evergreen_invoices_companyId_status_idx" ON "evergreen_invoices"("companyId", "status");

-- CreateIndex
CREATE INDEX "evergreen_overrides_subjectType_subjectId_policy_status_exp_idx" ON "evergreen_overrides"("subjectType", "subjectId", "policy", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "evergreen_match_runs_cohortId_createdAt_idx" ON "evergreen_match_runs"("cohortId", "createdAt");

-- CreateIndex
CREATE INDEX "evergreen_match_runs_status_createdAt_idx" ON "evergreen_match_runs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "evergreen_mentorship_alternatives_companyId_studentId_compl_idx" ON "evergreen_mentorship_alternatives"("companyId", "studentId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_idempotencyKey_key" ON "outbox_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateType_aggregateId_createdAt_idx" ON "outbox_events"("aggregateType", "aggregateId", "createdAt");

-- CreateIndex
CREATE INDEX "evergreen_idempotency_keys_expiresAt_idx" ON "evergreen_idempotency_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "evergreen_idempotency_keys_actorId_operation_key_key" ON "evergreen_idempotency_keys"("actorId", "operation", "key");

-- CreateIndex
CREATE INDEX "evergreen_worker_leases_lockedUntil_idx" ON "evergreen_worker_leases"("lockedUntil");

-- CreateIndex
CREATE INDEX "evergreen_job_runs_jobName_startedAt_idx" ON "evergreen_job_runs"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "evergreen_job_runs_status_startedAt_idx" ON "evergreen_job_runs"("status", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "placements_candidateId_key" ON "placements"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "placements_offerId_key" ON "placements"("offerId");

-- CreateIndex
CREATE INDEX "placements_studentId_status_idx" ON "placements"("studentId", "status");

-- CreateIndex
CREATE INDEX "placements_companyId_status_idx" ON "placements"("companyId", "status");

-- CreateIndex
CREATE INDEX "placements_cohortId_status_idx" ON "placements"("cohortId", "status");

-- AddForeignKey
ALTER TABLE "evergreen_programs" ADD CONSTRAINT "evergreen_programs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_program_skills" ADD CONSTRAINT "evergreen_program_skills_programId_fkey" FOREIGN KEY ("programId") REFERENCES "evergreen_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_program_skills" ADD CONSTRAINT "evergreen_program_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_program_competencies" ADD CONSTRAINT "evergreen_program_competencies_programId_fkey" FOREIGN KEY ("programId") REFERENCES "evergreen_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_program_competencies" ADD CONSTRAINT "evergreen_program_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_program_supervisors" ADD CONSTRAINT "evergreen_program_supervisors_programId_fkey" FOREIGN KEY ("programId") REFERENCES "evergreen_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_program_supervisors" ADD CONSTRAINT "evergreen_program_supervisors_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "company_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_cohorts" ADD CONSTRAINT "evergreen_cohorts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "evergreen_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_candidates" ADD CONSTRAINT "evergreen_candidates_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "evergreen_cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_candidates" ADD CONSTRAINT "evergreen_candidates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_availability" ADD CONSTRAINT "placement_availability_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "evergreen_candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "company_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_offers" ADD CONSTRAINT "placement_offers_replacementOfferId_fkey" FOREIGN KEY ("replacementOfferId") REFERENCES "placement_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_programId_fkey" FOREIGN KEY ("programId") REFERENCES "evergreen_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "evergreen_cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "evergreen_candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "placement_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "company_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_placement_locks" ADD CONSTRAINT "active_placement_locks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_placement_locks" ADD CONSTRAINT "active_placement_locks_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_placement_locks" ADD CONSTRAINT "active_placement_locks_acquiredFromOfferId_fkey" FOREIGN KEY ("acquiredFromOfferId") REFERENCES "placement_offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_onboarding_items" ADD CONSTRAINT "placement_onboarding_items_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_goals" ADD CONSTRAINT "placement_goals_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_goals" ADD CONSTRAINT "placement_goals_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_check_ins" ADD CONSTRAINT "placement_check_ins_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_evidence" ADD CONSTRAINT "placement_evidence_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_evidence" ADD CONSTRAINT "placement_evidence_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_evaluations" ADD CONSTRAINT "placement_evaluations_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_amendments" ADD CONSTRAINT "placement_amendments_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_status_events" ADD CONSTRAINT "placement_status_events_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_support_requests" ADD CONSTRAINT "placement_support_requests_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "placements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_entitlements" ADD CONSTRAINT "evergreen_entitlements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_entitlements" ADD CONSTRAINT "evergreen_entitlements_sourceInvoiceId_fkey" FOREIGN KEY ("sourceInvoiceId") REFERENCES "evergreen_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_invoices" ADD CONSTRAINT "evergreen_invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_match_runs" ADD CONSTRAINT "evergreen_match_runs_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "evergreen_cohorts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_mentorship_alternatives" ADD CONSTRAINT "evergreen_mentorship_alternatives_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evergreen_mentorship_alternatives" ADD CONSTRAINT "evergreen_mentorship_alternatives_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;



-- Evergreen integrity constraints that Prisma cannot express.
ALTER TABLE "evergreen_programs"
  ADD CONSTRAINT "evergreen_programs_first_release_type_check" CHECK ("placementType" IN ('INTERNSHIP', 'ATTACHMENT')),
  ADD CONSTRAINT "evergreen_programs_duration_check" CHECK ("durationWeeks" > 0),
  ADD CONSTRAINT "evergreen_programs_seats_check" CHECK ("defaultSeatCount" > 0);

ALTER TABLE "evergreen_cohorts"
  ADD CONSTRAINT "evergreen_cohorts_seat_counts_check" CHECK ("seatCount" > 0 AND "reservedSeats" >= 0 AND "filledSeats" >= 0 AND "reservedSeats" <= "seatCount" AND "filledSeats" <= "seatCount"),
  ADD CONSTRAINT "evergreen_cohorts_date_order_check" CHECK ("applicationOpensAt" < "applicationClosesAt" AND "applicationClosesAt" <= "placementStartsAt" AND "placementStartsAt" < "placementEndsAt");

ALTER TABLE "placement_offers"
  ADD CONSTRAINT "placement_offers_date_order_check" CHECK ("startDate" < "endDate"),
  ADD CONSTRAINT "placement_offers_currency_check" CHECK (char_length("currency") = 3);

ALTER TABLE "placement_check_ins"
  ADD CONSTRAINT "placement_check_ins_period_check" CHECK ("periodStartsAt" < "periodEndsAt");

ALTER TABLE "evergreen_entitlements"
  ADD CONSTRAINT "evergreen_entitlements_limits_check" CHECK ("programLimit" >= 0 AND "seatLimit" >= 0),
  ADD CONSTRAINT "evergreen_entitlements_dates_check" CHECK ("validFrom" < "validUntil");

ALTER TABLE "evergreen_invoices"
  ADD CONSTRAINT "evergreen_invoices_amount_check" CHECK ("amount" > 0),
  ADD CONSTRAINT "evergreen_invoices_currency_check" CHECK (char_length("currency") = 3);
