-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT_STANDARD', 'STUDENT_TRANSITION', 'STUDENT_ALUMNI', 'CAMPUS_AMBASSADOR', 'COMPANY_STANDARD', 'COMPANY_PIPELINE_PARTNER', 'COMPANY_HR_MANAGER', 'COMPANY_HIRING_MANAGER', 'COMPANY_VIEWER', 'SAFETY_OFFICER', 'OPERATIONS_MANAGER', 'CAMPUS_MANAGER', 'FINANCE_OFFICER', 'CONTENT_MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PipelineStage" AS ENUM ('EXPLORE_FOUNDATION', 'BUILD_APPLY', 'GROW_SPECIALIZE', 'LEAD_IMPACT', 'ADVANCE_MENTOR');

-- CreateEnum
CREATE TYPE "PipelineRelationshipStatus" AS ENUM ('EARLY', 'WARMING_UP', 'ACTIVE', 'PLACEMENT_READY', 'PLACED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ESCROW_HOLD', 'ESCROW_RELEASE', 'ESCROW_REFUND', 'STUDENT_PAYOUT', 'PLATFORM_FEE', 'CHAMA_CONTRIBUTION', 'CHAMA_DISBURSEMENT', 'CHAMA_INVESTMENT', 'MICRO_ADVANCE', 'ADVANCE_REPAYMENT', 'COMPANY_PAYMENT', 'RESOURCE_PURCHASE', 'RESOURCE_SALE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "MpesaDirection" AS ENUM ('STK_PUSH', 'B2C', 'C2B');

-- CreateEnum
CREATE TYPE "ScoreTier" AS ENUM ('PROVISIONAL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "SafetyReportType" AS ENUM ('FEELING_UNSAFE', 'INAPPROPRIATE_BEHAVIOUR', 'HARASSMENT', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyReportStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'RESOLVED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PlacementType" AS ENUM ('INTERNSHIP', 'ATTACHMENT', 'FULL_TIME', 'CONTRACT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "studentEmail" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT_STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "locationCity" TEXT NOT NULL DEFAULT 'Nairobi',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "campusId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "yearJoined" INTEGER NOT NULL,
    "courseDuration" INTEGER NOT NULL,
    "expectedGraduation" TIMESTAMP(3) NOT NULL,
    "studentIdNumber" TEXT,
    "careerPath" TEXT,
    "currentMode" TEXT NOT NULL DEFAULT 'EARN',
    "transitionUnlockedAt" TIMESTAMP(3),
    "alumniWindowExpiresAt" TIMESTAMP(3),
    "isOpenToHire" BOOLEAN NOT NULL DEFAULT false,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kycVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" TEXT,
    "city" TEXT NOT NULL,
    "locationLabel" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_content_items" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "org" TEXT,
    "meta" TEXT,
    "value" TEXT,
    "imageUrl" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "href" TEXT,
    "actionLabel" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payload" JSONB,
    "studentId" TEXT,
    "campusId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_stories" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "caption" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "thumbnailUrl" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_posts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "campusId" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postType" TEXT NOT NULL DEFAULT 'GENERAL',
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "pinnedUntil" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_shops" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "campusId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "locationLabel" TEXT,
    "deliveryOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pickupSpots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactRules" TEXT,
    "returnRules" TEXT,
    "socialLinks" JSONB,
    "payload" JSONB,
    "ratingAverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_shop_managers" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_shop_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT,
    "sellerId" TEXT NOT NULL,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'PRODUCT',
    "condition" TEXT,
    "priceAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationLabel" TEXT,
    "deliveryOptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "variants" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "stockCount" INTEGER NOT NULL DEFAULT 1,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "savedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "seedKey" TEXT,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT,
    "budgetAmount" DOUBLE PRECISION NOT NULL,
    "budget" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "minimumFollowers" INTEGER NOT NULL DEFAULT 0,
    "payoutPerCampaigner" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proofRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materials" JSONB,
    "thumbnailTitle" TEXT,
    "thumbnailMeta" TEXT,
    "previewImage" TEXT,
    "objective" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetAudience" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "timelineLabel" TEXT,
    "timelineValue" TEXT,
    "creatorsLimit" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "acceptedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inviteOnlyUntil" TIMESTAMP(3),
    "workflow" JSONB,
    "stats" JSONB,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zumbarl_ads" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "businessId" TEXT,
    "headline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "callToAction" TEXT,
    "destinationUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zumbarl_ads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_invites" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_acceptances" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "payoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trackingToken" TEXT,
    "trackingDestinationUrl" TEXT,
    "trackingClicks" INTEGER NOT NULL DEFAULT 0,
    "trackingVisits" INTEGER NOT NULL DEFAULT 0,
    "promoCode" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_clicks" (
    "id" TEXT NOT NULL,
    "acceptanceId" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 1,
    "firstClickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastClickedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaign_proofs" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "studentId" TEXT,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "screenshots" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platformUploads" JSONB,
    "reach" INTEGER,
    "engagement" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaign_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safetyPreferences" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'campus',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_relationships" (
    "id" TEXT NOT NULL,
    "actorStudentId" TEXT NOT NULL,
    "targetStudentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_stories" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "studentId" TEXT,
    "knowledgeSpaceId" TEXT,
    "text" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'campus',
    "context" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'live',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_story_reactions" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_story_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_story_comments" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_story_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_story_comment_reactions" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reaction" TEXT NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_story_comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_posts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "managedProfileId" TEXT,
    "knowledgeSpaceId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'post',
    "body" TEXT NOT NULL,
    "tags" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'campus',
    "status" TEXT NOT NULL DEFAULT 'published',
    "reactions" JSONB,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "reposts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "studentId" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_groups" (
    "id" TEXT NOT NULL,
    "ownerStudentId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "campus" TEXT,
    "contributionAmount" DOUBLE PRECISION,
    "contributionCadence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managed_profiles" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "coverImageUrl" TEXT,
    "locationLabel" TEXT,
    "campusId" TEXT,
    "communityGroupId" TEXT,
    "companyId" TEXT,
    "websiteUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "foundedAt" TIMESTAMP(3),
    "details" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managed_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managed_profile_managers" (
    "id" TEXT NOT NULL,
    "managedProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "managed_profile_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "managed_profile_followers" (
    "id" TEXT NOT NULL,
    "managedProfileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "managed_profile_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_group_memberships" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "role" TEXT NOT NULL DEFAULT 'member',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_chama_contributions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'recorded',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_chama_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellness_reports" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "category" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'open',
    "note" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counselor_bookings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "counselorId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselor_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_carts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "items" JSONB NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "cartId" TEXT,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'paid',
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'seller_confirmation',
    "handoffType" TEXT NOT NULL,
    "handoffSpot" TEXT NOT NULL,
    "paymentReference" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "buyerConfirmedAt" TIMESTAMP(3),
    "autoReleaseAt" TIMESTAMP(3),
    "escrowReleasedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_offers" (
    "id" TEXT NOT NULL,
    "listingReference" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "product" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_events" (
    "id" TEXT NOT NULL,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "organizerType" TEXT NOT NULL DEFAULT 'CAMPUS',
    "coverImageUrl" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "capacity" INTEGER,
    "priceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_event_rsvps" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GOING',
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campus_event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "sector" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "website" TEXT,
    "logoUrl" TEXT,
    "description" TEXT,
    "hiringGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "locationCity" TEXT NOT NULL DEFAULT 'Nairobi',
    "locationAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isPipelinePartner" BOOLEAN NOT NULL DEFAULT false,
    "hiringScore" DOUBLE PRECISION,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "kycVerifiedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "industries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'system',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "industries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_kyc" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'UNDER_REVIEW',
    "registeredBusinessName" TEXT NOT NULL,
    "incorporationCertificate" TEXT,
    "kraPinCertificate" TEXT,
    "businessRegistrationNumber" TEXT NOT NULL,
    "representativeFullName" TEXT NOT NULL,
    "representativeIdDocument" TEXT,
    "representativePhone" TEXT NOT NULL,
    "representativeEmail" TEXT NOT NULL,
    "representativeRole" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "companySize" TEXT NOT NULL,
    "physicalAddress" TEXT NOT NULL,
    "geoCoordinates" TEXT,
    "website" TEXT,
    "yearEstablished" INTEGER NOT NULL,
    "mpesaTillOrPaybill" TEXT,
    "bankAccountDetails" TEXT,
    "taxComplianceCertificate" TEXT,
    "linkedInCompanyPage" TEXT,
    "socialMediaPresence" TEXT,
    "verifiedCompanyReferral" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_kyc_documents" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaded_files" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "scope" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL DEFAULT 'zumbarl-public-assets',
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "status" TEXT NOT NULL DEFAULT 'complete',
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uploaded_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunities" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "postedByContactId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "opportunityType" TEXT NOT NULL DEFAULT 'Project',
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'draft',
    "scopeMode" TEXT NOT NULL DEFAULT 'deliverable',
    "opportunitySplash" JSONB,
    "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetLabel" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "paymentTerms" TEXT,
    "applicants" INTEGER NOT NULL DEFAULT 0,
    "invitedCount" INTEGER NOT NULL DEFAULT 0,
    "escrowStatus" TEXT NOT NULL DEFAULT 'unfunded',
    "deliverablesStatus" TEXT,
    "deliverableCount" INTEGER NOT NULL DEFAULT 0,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mustHave" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualificationQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredQualifications" JSONB,
    "portfolioRequired" TEXT,
    "requiredExperience" TEXT,
    "engagementMode" TEXT,
    "availability" TEXT,
    "duration" TEXT,
    "mode" TEXT,
    "applicationDeadline" TIMESTAMP(3),
    "deadlineLabel" TEXT,
    "companyName" TEXT,
    "companyDescription" TEXT,
    "acceptanceCriteria" TEXT,
    "deliverablesSummary" TEXT,
    "screeningFocus" TEXT,
    "bidderInstructions" TEXT,
    "clarityScore" INTEGER NOT NULL DEFAULT 0,
    "revisionLimit" INTEGER NOT NULL DEFAULT 3,
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_skills" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'opportunity',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_scope_items" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "scopeType" TEXT NOT NULL DEFAULT 'deliverable',
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "workflow" TEXT,
    "itemType" TEXT,
    "description" TEXT,
    "requirement" TEXT,
    "submissionMethod" TEXT,
    "verificationMethod" TEXT,
    "evidenceRequired" TEXT,
    "acceptanceCriteria" TEXT,
    "paymentRelease" TEXT,
    "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetLabel" TEXT,
    "paymentPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSubmissions" INTEGER,
    "lockedUntilApproved" BOOLEAN NOT NULL DEFAULT false,
    "isSequential" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "referenceFiles" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_scope_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scopeItemId" TEXT,
    "milestoneId" TEXT,
    "milestoneDeliverableId" TEXT,
    "sprintId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "declaredById" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "submissionId" TEXT,
    "blockedByIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockedByDependencyIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidence" JSONB,
    "droppedReason" TEXT,
    "paidAmount" DOUBLE PRECISION,
    "paidAt" TIMESTAMP(3),
    "declaredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "blockedAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_notes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scopeItemId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'note',
    "files" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestone_deliverables" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "workflow" TEXT,
    "requirement" TEXT,
    "submissionMethod" TEXT,
    "evidenceRequired" TEXT,
    "acceptanceCriteria" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "budgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startsAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milestone_deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_sprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "milestoneId" TEXT,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_settings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "allowInterns" BOOLEAN NOT NULL DEFAULT false,
    "allowAttachees" BOOLEAN NOT NULL DEFAULT false,
    "roleEarningFactors" JSONB,
    "sprintCadence" TEXT,
    "catchupCadence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_dependencies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scopeItemId" TEXT,
    "label" TEXT NOT NULL,
    "note" TEXT,
    "party" TEXT NOT NULL DEFAULT 'business',
    "status" TEXT NOT NULL DEFAULT 'open',
    "raisedById" TEXT,
    "raisedByName" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliverable_split_locks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scopeItemId" TEXT NOT NULL,
    "shares" JSONB NOT NULL,
    "confirmedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contributors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliverable_split_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_sample_work" (
    "id" TEXT NOT NULL,
    "scopeItemId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "files" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_sample_work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_required_attachments" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_required_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_activity_events" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_activity_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_invites" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "coverNote" TEXT,
    "proposal" TEXT,
    "bidAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "deliveryTime" TEXT,
    "intentId" TEXT,
    "intentLabel" TEXT,
    "inviteId" TEXT,
    "questionAnswers" JSONB,
    "attachments" JSONB,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "projectId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_interviews" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scheduledById" TEXT,
    "interviewType" TEXT NOT NULL DEFAULT 'video',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Nairobi',
    "meetingOption" TEXT NOT NULL DEFAULT 'generated',
    "meetingUrl" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "studentResponseNote" TEXT,
    "proposedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_submissions" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "scopeItemId" TEXT,
    "bidId" TEXT,
    "studentId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "fileUrls" TEXT[],
    "fileKeys" TEXT[],
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "lastRevisionAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "opportunity_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_ratings" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "communicationScore" DOUBLE PRECISION NOT NULL,
    "timeManagementScore" DOUBLE PRECISION NOT NULL,
    "skillsScore" DOUBLE PRECISION NOT NULL,
    "deliveryQualityScore" DOUBLE PRECISION NOT NULL,
    "creativityScore" DOUBLE PRECISION NOT NULL,
    "professionalismScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "briefAdherence" DOUBLE PRECISION NOT NULL,
    "revisionCycles" INTEGER NOT NULL,
    "wouldHireAgain" BOOLEAN NOT NULL,
    "publicFeedback" TEXT,
    "privateNote" TEXT,
    "isHeld" BOOLEAN NOT NULL DEFAULT false,
    "ratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zumbarl_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tier" "ScoreTier" NOT NULL DEFAULT 'BRONZE',
    "confidence" TEXT NOT NULL DEFAULT 'PROVISIONAL',
    "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "loyaltyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professionalismScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relationshipScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGigsCompleted" INTEGER NOT NULL DEFAULT 0,
    "repeatClientRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endorsementCount" INTEGER NOT NULL DEFAULT 0,
    "effectiveEngagements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uniqueClients" INTEGER NOT NULL DEFAULT 0,
    "conservativeLowerBound" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryPenaltyActive" BOOLEAN NOT NULL DEFAULT false,
    "qualityGateActive" BOOLEAN NOT NULL DEFAULT true,
    "isUnderReview" BOOLEAN NOT NULL DEFAULT false,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "lastRefreshedAt" TIMESTAMP(3),
    "nextRefreshAt" TIMESTAMP(3),
    "refreshCycleDays" INTEGER NOT NULL DEFAULT 18,
    "previousScore" DOUBLE PRECISION,
    "scoreVelocity" DOUBLE PRECISION,
    "trendDirection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zumbarl_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_snapshots" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "tier" "ScoreTier" NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,
    "volumeScore" DOUBLE PRECISION NOT NULL,
    "loyaltyScore" DOUBLE PRECISION NOT NULL,
    "trustScore" DOUBLE PRECISION NOT NULL,
    "deliveryScore" DOUBLE PRECISION NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'PROVISIONAL',
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "professionalismScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relationshipScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effectiveEngagements" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uniqueClients" INTEGER NOT NULL DEFAULT 0,
    "totalEngagements" INTEGER NOT NULL DEFAULT 0,
    "conservativeLowerBound" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "categoryScores" JSONB,
    "isUnderReview" BOOLEAN NOT NULL DEFAULT false,
    "isRestricted" BOOLEAN NOT NULL DEFAULT false,
    "snapshotReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_outcomes" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "projectId" TEXT,
    "category" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "contractValueKes" DOUBLE PRECISION NOT NULL,
    "categoryMedianValueKes" DOUBLE PRECISION NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "raterIsCredible" BOOLEAN NOT NULL DEFAULT true,
    "deliveryQualityRating" DOUBLE PRECISION NOT NULL,
    "briefAdherenceRating" DOUBLE PRECISION NOT NULL,
    "categoryRubricScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "firstPassAccepted" BOOLEAN NOT NULL DEFAULT false,
    "completedWithinDeadline" BOOLEAN NOT NULL,
    "deadlineMissWasStudentFault" BOOLEAN NOT NULL DEFAULT false,
    "submissionWasComplete" BOOLEAN NOT NULL DEFAULT true,
    "studentCancelledMidway" BOOLEAN NOT NULL DEFAULT false,
    "attributableRevisionCount" INTEGER NOT NULL DEFAULT 0,
    "contractRevisionAllowance" INTEGER NOT NULL DEFAULT 2,
    "communicationRating" DOUBLE PRECISION NOT NULL,
    "conductRating" DOUBLE PRECISION NOT NULL,
    "disputeRaised" BOOLEAN NOT NULL DEFAULT false,
    "disputeUpheldAgainstStudent" BOOLEAN NOT NULL DEFAULT false,
    "wouldHireAgain" BOOLEAN NOT NULL,
    "isRepeatEngagement" BOOLEAN NOT NULL DEFAULT false,
    "clientSatisfactionRating" DOUBLE PRECISION NOT NULL,
    "publicFeedback" TEXT,
    "categoryRubricEvidence" JSONB,
    "isQuarantined" BOOLEAN NOT NULL DEFAULT false,
    "quarantineNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_category_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "engagements" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_category_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_levels" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "verifiedByGigs" INTEGER NOT NULL DEFAULT 0,
    "lastAdvancedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'seed',
    "mergedIntoSkillId" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdByUserId" TEXT,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_aliases" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_skills" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL DEFAULT 'BEGINNER',
    "verifiedByGigs" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'student_profile',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "endorsedByName" TEXT NOT NULL,
    "endorsedByTitle" TEXT NOT NULL,
    "note" TEXT,
    "currencyAwarded" INTEGER NOT NULL DEFAULT 12,
    "opportunityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconKey" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_relationships" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "PipelineRelationshipStatus" NOT NULL DEFAULT 'EARLY',
    "gigsCompleted" INTEGER NOT NULL DEFAULT 0,
    "avgRatingGiven" DOUBLE PRECISION,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flaggedAt" TIMESTAMP(3),
    "notes" TEXT,
    "readinessScore" DOUBLE PRECISION,
    "targetRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_stage_progress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "stage" "PipelineStage" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "projectsCompleted" INTEGER NOT NULL DEFAULT 0,
    "companiesWorkedWith" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_stage_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roadmaps" (
    "id" TEXT NOT NULL,
    "campusId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "careerFamily" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'BEGINNER',
    "estimatedWeeks" INTEGER NOT NULL DEFAULT 4,
    "coverImageUrl" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "outcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "intents" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceWeight" INTEGER NOT NULL DEFAULT 80,
    "testWeight" INTEGER NOT NULL DEFAULT 20,
    "verificationThreshold" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roadmap_steps" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "stepType" TEXT NOT NULL DEFAULT 'LEARNING',
    "resourceUrl" TEXT,
    "evidenceType" TEXT,
    "estimatedHours" DOUBLE PRECISION,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "assessment" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_roadmap_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_roadmap_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStepOrder" INTEGER NOT NULL DEFAULT 0,
    "completedStepIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "evidenceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "intent" TEXT NOT NULL DEFAULT 'explore',
    "lockedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_roadmap_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencies" (
    "id" TEXT NOT NULL,
    "skillId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'FOUNDATION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roadmap_step_competencies" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "requiredScore" INTEGER NOT NULL DEFAULT 70,

    CONSTRAINT "career_roadmap_step_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_step_prerequisites" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "prerequisiteStepId" TEXT NOT NULL,

    CONSTRAINT "roadmap_step_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL DEFAULT 'ARTICLE',
    "url" TEXT,
    "provider" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "content" JSONB,
    "practice" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_spaces" (
    "id" TEXT NOT NULL,
    "ownerStudentId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "campusId" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'CAMPUS',
    "membershipMode" TEXT NOT NULL DEFAULT 'REQUEST',
    "avatarUrl" TEXT,
    "coverImageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_space_memberships" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_space_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_space_followers" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_space_followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_rooms" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "createdByStudentId" TEXT NOT NULL,
    "resourceId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_room_memberships" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_room_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_room_messages" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "authorStudentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "linkPreviews" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_room_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_resources" (
    "id" TEXT NOT NULL,
    "ownerStudentId" TEXT NOT NULL,
    "spaceId" TEXT,
    "sourceMessageId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resourceType" TEXT NOT NULL,
    "accessMode" TEXT NOT NULL DEFAULT 'FREE_READ',
    "subject" TEXT,
    "courseCode" TEXT,
    "unitId" TEXT,
    "academicYear" INTEGER,
    "institution" TEXT,
    "price" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "sourceMode" TEXT NOT NULL DEFAULT 'LINK',
    "fileUrl" TEXT,
    "fileUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "coverImageUrl" TEXT,
    "previewText" TEXT,
    "availableCopies" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_resource_accesses" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "amount" DOUBLE PRECISION,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_resource_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_resource_competencies" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,

    CONSTRAINT "learning_resource_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_roadmap_step_resources" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "career_roadmap_step_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_competencies" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "opportunity_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_competency_states" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "evidenceScore" INTEGER NOT NULL DEFAULT 0,
    "assessmentScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_competency_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_roadmap_step_progress" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "evidenceScore" INTEGER NOT NULL DEFAULT 0,
    "testScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_roadmap_step_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_assessment_attempts" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "assessmentVersion" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_assessment_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_practice_submissions" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_practice_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_evidence" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "competencyId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "note" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "scoreAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedByUserId" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_stage_transitions" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "fromStepId" TEXT,
    "toStepId" TEXT,
    "reason" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_stage_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_items" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "fileUrls" TEXT[],
    "companyName" TEXT,
    "clientFeedback" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "impactMetrics" JSONB,
    "metricsVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placements" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "PlacementType" NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "salaryOffered" DOUBLE PRECISION,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "platformFee" DOUBLE PRECISION,

    CONSTRAINT "placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "skillName" TEXT,
    "level" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "verificationHash" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MAIN',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_wallets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT,
    "companyWalletId" TEXT,
    "chamaWalletId" TEXT,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "reference" TEXT NOT NULL,
    "mpesaRef" TEXT,
    "mpesaDirection" "MpesaDirection",
    "description" TEXT,
    "opportunityId" TEXT,
    "metadata" JSONB,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_escrow_holds" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "studentId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "transactionRef" TEXT,

    CONSTRAINT "opportunity_escrow_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "micro_advances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repaidAt" TIMESTAMP(3),
    "repaymentRef" TEXT,

    CONSTRAINT "micro_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "campusId" TEXT NOT NULL,
    "contributionPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chamas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_members" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "totalContributed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_wallets" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chama_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chama_whitelisted_payees" (
    "id" TEXT NOT NULL,
    "chamaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chama_whitelisted_payees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_reports" (
    "id" TEXT NOT NULL,
    "reporterUserId" TEXT NOT NULL,
    "reportedEntity" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "opportunityId" TEXT,
    "type" "SafetyReportType" NOT NULL,
    "status" "SafetyReportStatus" NOT NULL DEFAULT 'RECEIVED',
    "description" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "sentVia" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_team_invites" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "inviterUserId" TEXT NOT NULL,
    "inviteeUserId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Contributor',
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_team_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_team_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Contributor',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_sessions" (
    "id" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "callType" TEXT NOT NULL,
    "roomUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "fileUrls" TEXT[],
    "context" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campus_managers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campus_managers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_records" (
    "id" TEXT NOT NULL,
    "collection" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentEmail_key" ON "users"("studentEmail");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_refreshToken_idx" ON "sessions"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_userId_key" ON "student_profiles"("userId");

-- CreateIndex
CREATE INDEX "student_profiles_campusId_idx" ON "student_profiles"("campusId");

-- CreateIndex
CREATE INDEX "student_profiles_kycStatus_idx" ON "student_profiles"("kycStatus");

-- CreateIndex
CREATE INDEX "campus_content_items_scope_section_idx" ON "campus_content_items"("scope", "section");

-- CreateIndex
CREATE INDEX "campus_content_items_studentId_idx" ON "campus_content_items"("studentId");

-- CreateIndex
CREATE INDEX "campus_content_items_campusId_idx" ON "campus_content_items"("campusId");

-- CreateIndex
CREATE INDEX "kyc_documents_studentId_idx" ON "kyc_documents"("studentId");

-- CreateIndex
CREATE INDEX "student_stories_studentId_idx" ON "student_stories"("studentId");

-- CreateIndex
CREATE INDEX "student_stories_campusId_idx" ON "student_stories"("campusId");

-- CreateIndex
CREATE INDEX "student_stories_status_publishedAt_idx" ON "student_stories"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "campus_posts_studentId_idx" ON "campus_posts"("studentId");

-- CreateIndex
CREATE INDEX "campus_posts_campusId_idx" ON "campus_posts"("campusId");

-- CreateIndex
CREATE INDEX "campus_posts_postType_status_idx" ON "campus_posts"("postType", "status");

-- CreateIndex
CREATE INDEX "campus_posts_publishedAt_idx" ON "campus_posts"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_shops_slug_key" ON "marketplace_shops"("slug");

-- CreateIndex
CREATE INDEX "marketplace_shops_ownerId_idx" ON "marketplace_shops"("ownerId");

-- CreateIndex
CREATE INDEX "marketplace_shops_campusId_idx" ON "marketplace_shops"("campusId");

-- CreateIndex
CREATE INDEX "marketplace_shops_category_status_idx" ON "marketplace_shops"("category", "status");

-- CreateIndex
CREATE INDEX "marketplace_shop_managers_userId_idx" ON "marketplace_shop_managers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_shop_managers_shopId_userId_key" ON "marketplace_shop_managers"("shopId", "userId");

-- CreateIndex
CREATE INDEX "marketplace_listings_shopId_idx" ON "marketplace_listings"("shopId");

-- CreateIndex
CREATE INDEX "marketplace_listings_sellerId_idx" ON "marketplace_listings"("sellerId");

-- CreateIndex
CREATE INDEX "marketplace_listings_campusId_idx" ON "marketplace_listings"("campusId");

-- CreateIndex
CREATE INDEX "marketplace_listings_category_status_idx" ON "marketplace_listings"("category", "status");

-- CreateIndex
CREATE INDEX "marketplace_listings_createdAt_idx" ON "marketplace_listings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaigns_seedKey_key" ON "marketing_campaigns"("seedKey");

-- CreateIndex
CREATE INDEX "marketing_campaigns_businessId_idx" ON "marketing_campaigns"("businessId");

-- CreateIndex
CREATE INDEX "marketing_campaigns_status_createdAt_idx" ON "marketing_campaigns"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "zumbarl_ads_campaignId_key" ON "zumbarl_ads"("campaignId");

-- CreateIndex
CREATE INDEX "zumbarl_ads_status_createdAt_idx" ON "zumbarl_ads"("status", "createdAt");

-- CreateIndex
CREATE INDEX "zumbarl_ads_businessId_idx" ON "zumbarl_ads"("businessId");

-- CreateIndex
CREATE INDEX "marketing_campaign_invites_campaignId_idx" ON "marketing_campaign_invites"("campaignId");

-- CreateIndex
CREATE INDEX "marketing_campaign_invites_studentId_status_idx" ON "marketing_campaign_invites"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_acceptances_trackingToken_key" ON "marketing_campaign_acceptances"("trackingToken");

-- CreateIndex
CREATE INDEX "marketing_campaign_acceptances_studentId_status_idx" ON "marketing_campaign_acceptances"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_acceptances_campaignId_studentId_key" ON "marketing_campaign_acceptances"("campaignId", "studentId");

-- CreateIndex
CREATE INDEX "marketing_campaign_clicks_acceptanceId_lastClickedAt_idx" ON "marketing_campaign_clicks"("acceptanceId", "lastClickedAt");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_campaign_clicks_acceptanceId_visitorHash_key" ON "marketing_campaign_clicks"("acceptanceId", "visitorHash");

-- CreateIndex
CREATE INDEX "marketing_campaign_proofs_campaignId_status_idx" ON "marketing_campaign_proofs"("campaignId", "status");

-- CreateIndex
CREATE INDEX "marketing_campaign_proofs_studentId_idx" ON "marketing_campaign_proofs"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "connect_profiles_studentId_key" ON "connect_profiles"("studentId");

-- CreateIndex
CREATE INDEX "connect_relationships_actorStudentId_type_idx" ON "connect_relationships"("actorStudentId", "type");

-- CreateIndex
CREATE INDEX "connect_relationships_targetStudentId_type_idx" ON "connect_relationships"("targetStudentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "connect_relationships_actorStudentId_targetStudentId_type_key" ON "connect_relationships"("actorStudentId", "targetStudentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "connect_stories_sourceId_key" ON "connect_stories"("sourceId");

-- CreateIndex
CREATE INDEX "connect_stories_studentId_idx" ON "connect_stories"("studentId");

-- CreateIndex
CREATE INDEX "connect_stories_knowledgeSpaceId_status_createdAt_idx" ON "connect_stories"("knowledgeSpaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "connect_stories_status_expiresAt_idx" ON "connect_stories"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "connect_story_reactions_storyId_idx" ON "connect_story_reactions"("storyId");

-- CreateIndex
CREATE INDEX "connect_story_reactions_studentId_idx" ON "connect_story_reactions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "connect_story_reactions_storyId_studentId_key" ON "connect_story_reactions"("storyId", "studentId");

-- CreateIndex
CREATE INDEX "connect_story_comments_storyId_status_createdAt_idx" ON "connect_story_comments"("storyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "connect_story_comments_studentId_idx" ON "connect_story_comments"("studentId");

-- CreateIndex
CREATE INDEX "connect_story_comment_reactions_commentId_idx" ON "connect_story_comment_reactions"("commentId");

-- CreateIndex
CREATE INDEX "connect_story_comment_reactions_studentId_idx" ON "connect_story_comment_reactions"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "connect_story_comment_reactions_commentId_studentId_key" ON "connect_story_comment_reactions"("commentId", "studentId");

-- CreateIndex
CREATE INDEX "connect_posts_studentId_idx" ON "connect_posts"("studentId");

-- CreateIndex
CREATE INDEX "connect_posts_managedProfileId_idx" ON "connect_posts"("managedProfileId");

-- CreateIndex
CREATE INDEX "connect_posts_knowledgeSpaceId_status_createdAt_idx" ON "connect_posts"("knowledgeSpaceId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "connect_posts_status_createdAt_idx" ON "connect_posts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "connect_comments_postId_status_idx" ON "connect_comments"("postId", "status");

-- CreateIndex
CREATE INDEX "connect_comments_studentId_idx" ON "connect_comments"("studentId");

-- CreateIndex
CREATE INDEX "community_groups_ownerStudentId_idx" ON "community_groups"("ownerStudentId");

-- CreateIndex
CREATE INDEX "community_groups_category_status_idx" ON "community_groups"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profiles_slug_key" ON "managed_profiles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profiles_handle_key" ON "managed_profiles"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profiles_campusId_key" ON "managed_profiles"("campusId");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profiles_communityGroupId_key" ON "managed_profiles"("communityGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profiles_companyId_key" ON "managed_profiles"("companyId");

-- CreateIndex
CREATE INDEX "managed_profiles_type_status_idx" ON "managed_profiles"("type", "status");

-- CreateIndex
CREATE INDEX "managed_profile_managers_userId_idx" ON "managed_profile_managers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profile_managers_managedProfileId_userId_key" ON "managed_profile_managers"("managedProfileId", "userId");

-- CreateIndex
CREATE INDEX "managed_profile_followers_userId_idx" ON "managed_profile_followers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "managed_profile_followers_managedProfileId_userId_key" ON "managed_profile_followers"("managedProfileId", "userId");

-- CreateIndex
CREATE INDEX "community_group_memberships_studentId_status_idx" ON "community_group_memberships"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "community_group_memberships_groupId_studentId_key" ON "community_group_memberships"("groupId", "studentId");

-- CreateIndex
CREATE INDEX "community_chama_contributions_groupId_createdAt_idx" ON "community_chama_contributions"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "community_chama_contributions_studentId_idx" ON "community_chama_contributions"("studentId");

-- CreateIndex
CREATE INDEX "wellness_reports_studentId_idx" ON "wellness_reports"("studentId");

-- CreateIndex
CREATE INDEX "wellness_reports_status_urgency_idx" ON "wellness_reports"("status", "urgency");

-- CreateIndex
CREATE INDEX "counselor_bookings_studentId_scheduledAt_idx" ON "counselor_bookings"("studentId", "scheduledAt");

-- CreateIndex
CREATE INDEX "counselor_bookings_counselorId_status_idx" ON "counselor_bookings"("counselorId", "status");

-- CreateIndex
CREATE INDEX "marketplace_carts_studentId_status_idx" ON "marketplace_carts"("studentId", "status");

-- CreateIndex
CREATE INDEX "marketplace_orders_studentId_createdAt_idx" ON "marketplace_orders"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_orders_status_fulfillmentStatus_idx" ON "marketplace_orders"("status", "fulfillmentStatus");

-- CreateIndex
CREATE INDEX "marketplace_offers_listingReference_createdAt_idx" ON "marketplace_offers"("listingReference", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_offers_buyerId_createdAt_idx" ON "marketplace_offers"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "marketplace_offers_sellerId_status_createdAt_idx" ON "marketplace_offers"("sellerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "campus_events_campusId_idx" ON "campus_events"("campusId");

-- CreateIndex
CREATE INDEX "campus_events_category_status_idx" ON "campus_events"("category", "status");

-- CreateIndex
CREATE INDEX "campus_events_startsAt_idx" ON "campus_events"("startsAt");

-- CreateIndex
CREATE INDEX "campus_event_rsvps_studentId_idx" ON "campus_event_rsvps"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "campus_event_rsvps_eventId_studentId_key" ON "campus_event_rsvps"("eventId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_registrationNumber_key" ON "companies"("registrationNumber");

-- CreateIndex
CREATE INDEX "companies_kycStatus_idx" ON "companies"("kycStatus");

-- CreateIndex
CREATE INDEX "companies_sector_idx" ON "companies"("sector");

-- CreateIndex
CREATE UNIQUE INDEX "industries_name_key" ON "industries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "industries_slug_key" ON "industries"("slug");

-- CreateIndex
CREATE INDEX "industries_status_idx" ON "industries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_kyc_companyId_key" ON "business_kyc"("companyId");

-- CreateIndex
CREATE INDEX "business_kyc_status_idx" ON "business_kyc"("status");

-- CreateIndex
CREATE UNIQUE INDEX "company_contacts_userId_key" ON "company_contacts"("userId");

-- CreateIndex
CREATE INDEX "company_contacts_companyId_idx" ON "company_contacts"("companyId");

-- CreateIndex
CREATE INDEX "company_kyc_documents_companyId_idx" ON "company_kyc_documents"("companyId");

-- CreateIndex
CREATE INDEX "uploaded_files_ownerId_idx" ON "uploaded_files"("ownerId");

-- CreateIndex
CREATE INDEX "uploaded_files_bucket_idx" ON "uploaded_files"("bucket");

-- CreateIndex
CREATE INDEX "uploaded_files_scope_idx" ON "uploaded_files"("scope");

-- CreateIndex
CREATE INDEX "uploaded_files_status_idx" ON "uploaded_files"("status");

-- CreateIndex
CREATE INDEX "uploaded_files_isSeed_idx" ON "uploaded_files"("isSeed");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_bucket_storageKey_key" ON "uploaded_files"("bucket", "storageKey");

-- CreateIndex
CREATE INDEX "opportunities_companyId_idx" ON "opportunities"("companyId");

-- CreateIndex
CREATE INDEX "opportunities_postedByContactId_idx" ON "opportunities"("postedByContactId");

-- CreateIndex
CREATE INDEX "opportunities_status_idx" ON "opportunities"("status");

-- CreateIndex
CREATE INDEX "opportunities_visibility_idx" ON "opportunities"("visibility");

-- CreateIndex
CREATE INDEX "opportunities_scopeMode_idx" ON "opportunities"("scopeMode");

-- CreateIndex
CREATE INDEX "opportunities_opportunityType_idx" ON "opportunities"("opportunityType");

-- CreateIndex
CREATE INDEX "opportunities_category_idx" ON "opportunities"("category");

-- CreateIndex
CREATE INDEX "opportunities_createdAt_idx" ON "opportunities"("createdAt");

-- CreateIndex
CREATE INDEX "opportunity_skills_opportunityId_idx" ON "opportunity_skills"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_skills_skillId_idx" ON "opportunity_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_skills_opportunityId_skillId_key" ON "opportunity_skills"("opportunityId", "skillId");

-- CreateIndex
CREATE INDEX "opportunity_scope_items_opportunityId_idx" ON "opportunity_scope_items"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_scope_items_scopeType_idx" ON "opportunity_scope_items"("scopeType");

-- CreateIndex
CREATE INDEX "opportunity_scope_items_status_idx" ON "opportunity_scope_items"("status");

-- CreateIndex
CREATE INDEX "deliverable_tasks_projectId_idx" ON "deliverable_tasks"("projectId");

-- CreateIndex
CREATE INDEX "deliverable_tasks_scopeItemId_idx" ON "deliverable_tasks"("scopeItemId");

-- CreateIndex
CREATE INDEX "deliverable_tasks_ownerId_idx" ON "deliverable_tasks"("ownerId");

-- CreateIndex
CREATE INDEX "deliverable_tasks_status_idx" ON "deliverable_tasks"("status");

-- CreateIndex
CREATE INDEX "deliverable_notes_projectId_idx" ON "deliverable_notes"("projectId");

-- CreateIndex
CREATE INDEX "deliverable_notes_scopeItemId_idx" ON "deliverable_notes"("scopeItemId");

-- CreateIndex
CREATE INDEX "milestone_deliverables_projectId_idx" ON "milestone_deliverables"("projectId");

-- CreateIndex
CREATE INDEX "milestone_deliverables_milestoneId_idx" ON "milestone_deliverables"("milestoneId");

-- CreateIndex
CREATE INDEX "project_sprints_projectId_idx" ON "project_sprints"("projectId");

-- CreateIndex
CREATE INDEX "project_sprints_milestoneId_idx" ON "project_sprints"("milestoneId");

-- CreateIndex
CREATE UNIQUE INDEX "project_settings_projectId_key" ON "project_settings"("projectId");

-- CreateIndex
CREATE INDEX "deliverable_dependencies_projectId_idx" ON "deliverable_dependencies"("projectId");

-- CreateIndex
CREATE INDEX "deliverable_dependencies_scopeItemId_idx" ON "deliverable_dependencies"("scopeItemId");

-- CreateIndex
CREATE INDEX "deliverable_dependencies_status_idx" ON "deliverable_dependencies"("status");

-- CreateIndex
CREATE INDEX "deliverable_split_locks_projectId_idx" ON "deliverable_split_locks"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "deliverable_split_locks_projectId_scopeItemId_key" ON "deliverable_split_locks"("projectId", "scopeItemId");

-- CreateIndex
CREATE INDEX "opportunity_sample_work_scopeItemId_idx" ON "opportunity_sample_work"("scopeItemId");

-- CreateIndex
CREATE INDEX "opportunity_required_attachments_opportunityId_idx" ON "opportunity_required_attachments"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_activity_events_opportunityId_idx" ON "opportunity_activity_events"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_activity_events_actorId_idx" ON "opportunity_activity_events"("actorId");

-- CreateIndex
CREATE INDEX "opportunity_activity_events_action_idx" ON "opportunity_activity_events"("action");

-- CreateIndex
CREATE INDEX "opportunity_activity_events_createdAt_idx" ON "opportunity_activity_events"("createdAt");

-- CreateIndex
CREATE INDEX "opportunity_invites_opportunityId_idx" ON "opportunity_invites"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_invites_studentId_idx" ON "opportunity_invites"("studentId");

-- CreateIndex
CREATE INDEX "opportunity_invites_status_idx" ON "opportunity_invites"("status");

-- CreateIndex
CREATE INDEX "bids_opportunityId_idx" ON "bids"("opportunityId");

-- CreateIndex
CREATE INDEX "bids_studentId_idx" ON "bids"("studentId");

-- CreateIndex
CREATE INDEX "bids_status_idx" ON "bids"("status");

-- CreateIndex
CREATE UNIQUE INDEX "bids_opportunityId_studentId_key" ON "bids"("opportunityId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_interviews_bidId_key" ON "opportunity_interviews"("bidId");

-- CreateIndex
CREATE INDEX "opportunity_interviews_opportunityId_idx" ON "opportunity_interviews"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_interviews_studentId_idx" ON "opportunity_interviews"("studentId");

-- CreateIndex
CREATE INDEX "opportunity_interviews_status_idx" ON "opportunity_interviews"("status");

-- CreateIndex
CREATE INDEX "opportunity_interviews_scheduledAt_idx" ON "opportunity_interviews"("scheduledAt");

-- CreateIndex
CREATE INDEX "opportunity_submissions_opportunityId_idx" ON "opportunity_submissions"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_submissions_scopeItemId_idx" ON "opportunity_submissions"("scopeItemId");

-- CreateIndex
CREATE INDEX "opportunity_submissions_bidId_idx" ON "opportunity_submissions"("bidId");

-- CreateIndex
CREATE INDEX "opportunity_submissions_studentId_idx" ON "opportunity_submissions"("studentId");

-- CreateIndex
CREATE INDEX "opportunity_submissions_status_idx" ON "opportunity_submissions"("status");

-- CreateIndex
CREATE INDEX "opportunity_ratings_opportunityId_idx" ON "opportunity_ratings"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_ratings_studentId_idx" ON "opportunity_ratings"("studentId");

-- CreateIndex
CREATE INDEX "opportunity_ratings_companyId_idx" ON "opportunity_ratings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "zumbarl_scores_studentId_key" ON "zumbarl_scores"("studentId");

-- CreateIndex
CREATE INDEX "score_snapshots_studentId_idx" ON "score_snapshots"("studentId");

-- CreateIndex
CREATE INDEX "score_snapshots_createdAt_idx" ON "score_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "engagement_outcomes_studentId_completedAt_idx" ON "engagement_outcomes"("studentId", "completedAt");

-- CreateIndex
CREATE INDEX "engagement_outcomes_companyId_idx" ON "engagement_outcomes"("companyId");

-- CreateIndex
CREATE INDEX "engagement_outcomes_category_idx" ON "engagement_outcomes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_outcomes_studentId_opportunityId_key" ON "engagement_outcomes"("studentId", "opportunityId");

-- CreateIndex
CREATE INDEX "student_category_scores_category_score_idx" ON "student_category_scores"("category", "score");

-- CreateIndex
CREATE UNIQUE INDEX "student_category_scores_studentId_category_key" ON "student_category_scores"("studentId", "category");

-- CreateIndex
CREATE INDEX "skill_levels_studentId_idx" ON "skill_levels"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_levels_studentId_skillName_key" ON "skill_levels"("studentId", "skillName");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_name_key" ON "skill_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_slug_key" ON "skill_categories"("slug");

-- CreateIndex
CREATE INDEX "skill_categories_status_idx" ON "skill_categories"("status");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_categoryId_idx" ON "skills"("categoryId");

-- CreateIndex
CREATE INDEX "skills_status_idx" ON "skills"("status");

-- CreateIndex
CREATE INDEX "skills_source_idx" ON "skills"("source");

-- CreateIndex
CREATE INDEX "skills_usageCount_idx" ON "skills"("usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "skill_aliases_slug_key" ON "skill_aliases"("slug");

-- CreateIndex
CREATE INDEX "skill_aliases_skillId_idx" ON "skill_aliases"("skillId");

-- CreateIndex
CREATE INDEX "student_skills_studentId_idx" ON "student_skills"("studentId");

-- CreateIndex
CREATE INDEX "student_skills_skillId_idx" ON "student_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "student_skills_studentId_skillId_key" ON "student_skills"("studentId", "skillId");

-- CreateIndex
CREATE INDEX "endorsements_studentId_idx" ON "endorsements"("studentId");

-- CreateIndex
CREATE INDEX "endorsements_companyId_idx" ON "endorsements"("companyId");

-- CreateIndex
CREATE INDEX "achievements_studentId_idx" ON "achievements"("studentId");

-- CreateIndex
CREATE INDEX "pipeline_relationships_studentId_idx" ON "pipeline_relationships"("studentId");

-- CreateIndex
CREATE INDEX "pipeline_relationships_companyId_idx" ON "pipeline_relationships"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_relationships_studentId_companyId_key" ON "pipeline_relationships"("studentId", "companyId");

-- CreateIndex
CREATE INDEX "career_stage_progress_studentId_idx" ON "career_stage_progress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "career_stage_progress_studentId_stage_key" ON "career_stage_progress"("studentId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "career_roadmaps_slug_key" ON "career_roadmaps"("slug");

-- CreateIndex
CREATE INDEX "career_roadmaps_campusId_idx" ON "career_roadmaps"("campusId");

-- CreateIndex
CREATE INDEX "career_roadmaps_careerFamily_status_idx" ON "career_roadmaps"("careerFamily", "status");

-- CreateIndex
CREATE INDEX "career_roadmap_steps_roadmapId_idx" ON "career_roadmap_steps"("roadmapId");

-- CreateIndex
CREATE INDEX "student_roadmap_enrollments_studentId_idx" ON "student_roadmap_enrollments"("studentId");

-- CreateIndex
CREATE INDEX "student_roadmap_enrollments_roadmapId_idx" ON "student_roadmap_enrollments"("roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "student_roadmap_enrollments_studentId_roadmapId_key" ON "student_roadmap_enrollments"("studentId", "roadmapId");

-- CreateIndex
CREATE UNIQUE INDEX "competencies_slug_key" ON "competencies"("slug");

-- CreateIndex
CREATE INDEX "competencies_skillId_idx" ON "competencies"("skillId");

-- CreateIndex
CREATE INDEX "competencies_status_idx" ON "competencies"("status");

-- CreateIndex
CREATE INDEX "career_roadmap_step_competencies_competencyId_idx" ON "career_roadmap_step_competencies"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "career_roadmap_step_competencies_stepId_competencyId_key" ON "career_roadmap_step_competencies"("stepId", "competencyId");

-- CreateIndex
CREATE INDEX "roadmap_step_prerequisites_prerequisiteStepId_idx" ON "roadmap_step_prerequisites"("prerequisiteStepId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_step_prerequisites_stepId_prerequisiteStepId_key" ON "roadmap_step_prerequisites"("stepId", "prerequisiteStepId");

-- CreateIndex
CREATE INDEX "learning_resources_status_idx" ON "learning_resources"("status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_spaces_slug_key" ON "knowledge_spaces"("slug");

-- CreateIndex
CREATE INDEX "knowledge_spaces_type_status_idx" ON "knowledge_spaces"("type", "status");

-- CreateIndex
CREATE INDEX "knowledge_spaces_campusId_visibility_idx" ON "knowledge_spaces"("campusId", "visibility");

-- CreateIndex
CREATE INDEX "knowledge_space_memberships_studentId_status_idx" ON "knowledge_space_memberships"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_space_memberships_spaceId_studentId_key" ON "knowledge_space_memberships"("spaceId", "studentId");

-- CreateIndex
CREATE INDEX "knowledge_space_followers_studentId_idx" ON "knowledge_space_followers"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_space_followers_spaceId_studentId_key" ON "knowledge_space_followers"("spaceId", "studentId");

-- CreateIndex
CREATE INDEX "knowledge_rooms_spaceId_status_updatedAt_idx" ON "knowledge_rooms"("spaceId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "knowledge_rooms_resourceId_idx" ON "knowledge_rooms"("resourceId");

-- CreateIndex
CREATE INDEX "knowledge_room_memberships_studentId_status_idx" ON "knowledge_room_memberships"("studentId", "status");

-- CreateIndex
CREATE INDEX "knowledge_room_memberships_roomId_status_idx" ON "knowledge_room_memberships"("roomId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_room_memberships_roomId_studentId_key" ON "knowledge_room_memberships"("roomId", "studentId");

-- CreateIndex
CREATE INDEX "knowledge_room_messages_roomId_createdAt_idx" ON "knowledge_room_messages"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "knowledge_room_messages_authorStudentId_idx" ON "knowledge_room_messages"("authorStudentId");

-- CreateIndex
CREATE INDEX "knowledge_resources_resourceType_status_idx" ON "knowledge_resources"("resourceType", "status");

-- CreateIndex
CREATE INDEX "knowledge_resources_spaceId_createdAt_idx" ON "knowledge_resources"("spaceId", "createdAt");

-- CreateIndex
CREATE INDEX "knowledge_resources_sourceMessageId_idx" ON "knowledge_resources"("sourceMessageId");

-- CreateIndex
CREATE INDEX "knowledge_resources_unitId_idx" ON "knowledge_resources"("unitId");

-- CreateIndex
CREATE INDEX "knowledge_resources_ownerStudentId_createdAt_idx" ON "knowledge_resources"("ownerStudentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_units_normalizedName_key" ON "knowledge_units"("normalizedName");

-- CreateIndex
CREATE INDEX "knowledge_units_name_idx" ON "knowledge_units"("name");

-- CreateIndex
CREATE INDEX "knowledge_resource_accesses_studentId_status_idx" ON "knowledge_resource_accesses"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_resource_accesses_resourceId_studentId_action_key" ON "knowledge_resource_accesses"("resourceId", "studentId", "action");

-- CreateIndex
CREATE INDEX "learning_resource_competencies_competencyId_idx" ON "learning_resource_competencies"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_resource_competencies_resourceId_competencyId_key" ON "learning_resource_competencies"("resourceId", "competencyId");

-- CreateIndex
CREATE INDEX "career_roadmap_step_resources_resourceId_idx" ON "career_roadmap_step_resources"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "career_roadmap_step_resources_stepId_resourceId_key" ON "career_roadmap_step_resources"("stepId", "resourceId");

-- CreateIndex
CREATE INDEX "opportunity_competencies_competencyId_idx" ON "opportunity_competencies"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_competencies_opportunityId_competencyId_key" ON "opportunity_competencies"("opportunityId", "competencyId");

-- CreateIndex
CREATE INDEX "student_competency_states_competencyId_idx" ON "student_competency_states"("competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "student_competency_states_studentId_competencyId_key" ON "student_competency_states"("studentId", "competencyId");

-- CreateIndex
CREATE INDEX "student_roadmap_step_progress_stepId_idx" ON "student_roadmap_step_progress"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "student_roadmap_step_progress_enrollmentId_stepId_key" ON "student_roadmap_step_progress"("enrollmentId", "stepId");

-- CreateIndex
CREATE INDEX "roadmap_assessment_attempts_enrollmentId_stepId_completedAt_idx" ON "roadmap_assessment_attempts"("enrollmentId", "stepId", "completedAt");

-- CreateIndex
CREATE INDEX "roadmap_assessment_attempts_studentId_completedAt_idx" ON "roadmap_assessment_attempts"("studentId", "completedAt");

-- CreateIndex
CREATE INDEX "learning_practice_submissions_enrollmentId_stepId_idx" ON "learning_practice_submissions"("enrollmentId", "stepId");

-- CreateIndex
CREATE INDEX "learning_practice_submissions_studentId_submittedAt_idx" ON "learning_practice_submissions"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "roadmap_evidence_enrollmentId_stepId_idx" ON "roadmap_evidence"("enrollmentId", "stepId");

-- CreateIndex
CREATE INDEX "roadmap_evidence_studentId_verificationStatus_idx" ON "roadmap_evidence"("studentId", "verificationStatus");

-- CreateIndex
CREATE INDEX "roadmap_evidence_sourceType_sourceId_idx" ON "roadmap_evidence"("sourceType", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_evidence_enrollmentId_stepId_sourceType_sourceId_key" ON "roadmap_evidence"("enrollmentId", "stepId", "sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "roadmap_stage_transitions_enrollmentId_createdAt_idx" ON "roadmap_stage_transitions"("enrollmentId", "createdAt");

-- CreateIndex
CREATE INDEX "portfolio_items_studentId_idx" ON "portfolio_items"("studentId");

-- CreateIndex
CREATE INDEX "placements_studentId_idx" ON "placements"("studentId");

-- CreateIndex
CREATE INDEX "placements_companyId_idx" ON "placements"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationHash_key" ON "certificates"("verificationHash");

-- CreateIndex
CREATE INDEX "certificates_studentId_idx" ON "certificates"("studentId");

-- CreateIndex
CREATE INDEX "wallets_studentId_idx" ON "wallets"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "company_wallets_companyId_key" ON "company_wallets"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reference_key" ON "transactions"("reference");

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_companyWalletId_idx" ON "transactions"("companyWalletId");

-- CreateIndex
CREATE INDEX "transactions_opportunityId_idx" ON "transactions"("opportunityId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "opportunity_escrow_holds_opportunityId_idx" ON "opportunity_escrow_holds"("opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_escrow_holds_companyId_idx" ON "opportunity_escrow_holds"("companyId");

-- CreateIndex
CREATE INDEX "opportunity_escrow_holds_studentId_idx" ON "opportunity_escrow_holds"("studentId");

-- CreateIndex
CREATE INDEX "micro_advances_studentId_idx" ON "micro_advances"("studentId");

-- CreateIndex
CREATE INDEX "micro_advances_opportunityId_idx" ON "micro_advances"("opportunityId");

-- CreateIndex
CREATE INDEX "chamas_campusId_idx" ON "chamas"("campusId");

-- CreateIndex
CREATE INDEX "chama_members_chamaId_idx" ON "chama_members"("chamaId");

-- CreateIndex
CREATE INDEX "chama_members_studentId_idx" ON "chama_members"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "chama_members_chamaId_studentId_key" ON "chama_members"("chamaId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "chama_wallets_chamaId_key" ON "chama_wallets"("chamaId");

-- CreateIndex
CREATE INDEX "chama_whitelisted_payees_chamaId_idx" ON "chama_whitelisted_payees"("chamaId");

-- CreateIndex
CREATE INDEX "safety_reports_reporterUserId_idx" ON "safety_reports"("reporterUserId");

-- CreateIndex
CREATE INDEX "safety_reports_status_idx" ON "safety_reports"("status");

-- CreateIndex
CREATE INDEX "safety_reports_opportunityId_idx" ON "safety_reports"("opportunityId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "project_team_invites_projectId_idx" ON "project_team_invites"("projectId");

-- CreateIndex
CREATE INDEX "project_team_invites_inviteeUserId_status_idx" ON "project_team_invites"("inviteeUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "project_team_invites_projectId_inviteeUserId_key" ON "project_team_invites"("projectId", "inviteeUserId");

-- CreateIndex
CREATE INDEX "project_team_members_projectId_idx" ON "project_team_members"("projectId");

-- CreateIndex
CREATE INDEX "project_team_members_userId_idx" ON "project_team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_team_members_projectId_userId_key" ON "project_team_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "call_sessions_callerId_status_idx" ON "call_sessions"("callerId", "status");

-- CreateIndex
CREATE INDEX "call_sessions_recipientId_status_idx" ON "call_sessions"("recipientId", "status");

-- CreateIndex
CREATE INDEX "call_sessions_expiresAt_idx" ON "call_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "messages_opportunityId_idx" ON "messages"("opportunityId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_recipientId_idx" ON "messages"("recipientId");

-- CreateIndex
CREATE UNIQUE INDEX "campus_managers_userId_key" ON "campus_managers"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "workflow_records_collection_idx" ON "workflow_records"("collection");

-- CreateIndex
CREATE INDEX "workflow_records_collection_createdAt_idx" ON "workflow_records"("collection", "createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_content_items" ADD CONSTRAINT "campus_content_items_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_stories" ADD CONSTRAINT "student_stories_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_stories" ADD CONSTRAINT "student_stories_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_posts" ADD CONSTRAINT "campus_posts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_posts" ADD CONSTRAINT "campus_posts_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_shops" ADD CONSTRAINT "marketplace_shops_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_shops" ADD CONSTRAINT "marketplace_shops_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_shop_managers" ADD CONSTRAINT "marketplace_shop_managers_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "marketplace_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_shop_managers" ADD CONSTRAINT "marketplace_shop_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "marketplace_shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zumbarl_ads" ADD CONSTRAINT "zumbarl_ads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_invites" ADD CONSTRAINT "marketing_campaign_invites_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_acceptances" ADD CONSTRAINT "marketing_campaign_acceptances_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_clicks" ADD CONSTRAINT "marketing_campaign_clicks_acceptanceId_fkey" FOREIGN KEY ("acceptanceId") REFERENCES "marketing_campaign_acceptances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaign_proofs" ADD CONSTRAINT "marketing_campaign_proofs_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_relationships" ADD CONSTRAINT "connect_relationships_actorStudentId_fkey" FOREIGN KEY ("actorStudentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_relationships" ADD CONSTRAINT "connect_relationships_targetStudentId_fkey" FOREIGN KEY ("targetStudentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_stories" ADD CONSTRAINT "connect_stories_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_story_reactions" ADD CONSTRAINT "connect_story_reactions_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "connect_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_story_reactions" ADD CONSTRAINT "connect_story_reactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_story_comments" ADD CONSTRAINT "connect_story_comments_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "connect_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_story_comments" ADD CONSTRAINT "connect_story_comments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_story_comment_reactions" ADD CONSTRAINT "connect_story_comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "connect_story_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_story_comment_reactions" ADD CONSTRAINT "connect_story_comment_reactions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_posts" ADD CONSTRAINT "connect_posts_managedProfileId_fkey" FOREIGN KEY ("managedProfileId") REFERENCES "managed_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_comments" ADD CONSTRAINT "connect_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "connect_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profiles" ADD CONSTRAINT "managed_profiles_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profiles" ADD CONSTRAINT "managed_profiles_communityGroupId_fkey" FOREIGN KEY ("communityGroupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profiles" ADD CONSTRAINT "managed_profiles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profile_managers" ADD CONSTRAINT "managed_profile_managers_managedProfileId_fkey" FOREIGN KEY ("managedProfileId") REFERENCES "managed_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profile_managers" ADD CONSTRAINT "managed_profile_managers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profile_followers" ADD CONSTRAINT "managed_profile_followers_managedProfileId_fkey" FOREIGN KEY ("managedProfileId") REFERENCES "managed_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_profile_followers" ADD CONSTRAINT "managed_profile_followers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_group_memberships" ADD CONSTRAINT "community_group_memberships_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_chama_contributions" ADD CONSTRAINT "community_chama_contributions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_offers" ADD CONSTRAINT "marketplace_offers_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_events" ADD CONSTRAINT "campus_events_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_event_rsvps" ADD CONSTRAINT "campus_event_rsvps_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "campus_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_event_rsvps" ADD CONSTRAINT "campus_event_rsvps_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_kyc" ADD CONSTRAINT "business_kyc_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_kyc_documents" ADD CONSTRAINT "company_kyc_documents_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_postedByContactId_fkey" FOREIGN KEY ("postedByContactId") REFERENCES "company_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_skills" ADD CONSTRAINT "opportunity_skills_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_skills" ADD CONSTRAINT "opportunity_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_scope_items" ADD CONSTRAINT "opportunity_scope_items_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_tasks" ADD CONSTRAINT "deliverable_tasks_scopeItemId_fkey" FOREIGN KEY ("scopeItemId") REFERENCES "opportunity_scope_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliverable_tasks" ADD CONSTRAINT "deliverable_tasks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_sample_work" ADD CONSTRAINT "opportunity_sample_work_scopeItemId_fkey" FOREIGN KEY ("scopeItemId") REFERENCES "opportunity_scope_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_required_attachments" ADD CONSTRAINT "opportunity_required_attachments_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activity_events" ADD CONSTRAINT "opportunity_activity_events_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_invites" ADD CONSTRAINT "opportunity_invites_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_interviews" ADD CONSTRAINT "opportunity_interviews_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_submissions" ADD CONSTRAINT "opportunity_submissions_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_submissions" ADD CONSTRAINT "opportunity_submissions_scopeItemId_fkey" FOREIGN KEY ("scopeItemId") REFERENCES "opportunity_scope_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_submissions" ADD CONSTRAINT "opportunity_submissions_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_ratings" ADD CONSTRAINT "opportunity_ratings_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zumbarl_scores" ADD CONSTRAINT "zumbarl_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "zumbarl_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_outcomes" ADD CONSTRAINT "engagement_outcomes_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_outcomes" ADD CONSTRAINT "engagement_outcomes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_outcomes" ADD CONSTRAINT "engagement_outcomes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_category_scores" ADD CONSTRAINT "student_category_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_levels" ADD CONSTRAINT "skill_levels_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "skill_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_mergedIntoSkillId_fkey" FOREIGN KEY ("mergedIntoSkillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_aliases" ADD CONSTRAINT "skill_aliases_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_relationships" ADD CONSTRAINT "pipeline_relationships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_relationships" ADD CONSTRAINT "pipeline_relationships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmaps" ADD CONSTRAINT "career_roadmaps_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmap_steps" ADD CONSTRAINT "career_roadmap_steps_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "career_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_enrollments" ADD CONSTRAINT "student_roadmap_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_enrollments" ADD CONSTRAINT "student_roadmap_enrollments_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "career_roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competencies" ADD CONSTRAINT "competencies_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmap_step_competencies" ADD CONSTRAINT "career_roadmap_step_competencies_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmap_step_competencies" ADD CONSTRAINT "career_roadmap_step_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_step_prerequisites" ADD CONSTRAINT "roadmap_step_prerequisites_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_step_prerequisites" ADD CONSTRAINT "roadmap_step_prerequisites_prerequisiteStepId_fkey" FOREIGN KEY ("prerequisiteStepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_spaces" ADD CONSTRAINT "knowledge_spaces_ownerStudentId_fkey" FOREIGN KEY ("ownerStudentId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_space_memberships" ADD CONSTRAINT "knowledge_space_memberships_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_space_memberships" ADD CONSTRAINT "knowledge_space_memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_space_followers" ADD CONSTRAINT "knowledge_space_followers_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_space_followers" ADD CONSTRAINT "knowledge_space_followers_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_rooms" ADD CONSTRAINT "knowledge_rooms_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "knowledge_spaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_rooms" ADD CONSTRAINT "knowledge_rooms_createdByStudentId_fkey" FOREIGN KEY ("createdByStudentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_rooms" ADD CONSTRAINT "knowledge_rooms_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "knowledge_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_room_memberships" ADD CONSTRAINT "knowledge_room_memberships_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "knowledge_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_room_memberships" ADD CONSTRAINT "knowledge_room_memberships_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_room_messages" ADD CONSTRAINT "knowledge_room_messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "knowledge_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_room_messages" ADD CONSTRAINT "knowledge_room_messages_authorStudentId_fkey" FOREIGN KEY ("authorStudentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_ownerStudentId_fkey" FOREIGN KEY ("ownerStudentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "knowledge_spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "knowledge_room_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resources" ADD CONSTRAINT "knowledge_resources_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "knowledge_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource_accesses" ADD CONSTRAINT "knowledge_resource_accesses_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "knowledge_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_resource_accesses" ADD CONSTRAINT "knowledge_resource_accesses_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resource_competencies" ADD CONSTRAINT "learning_resource_competencies_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_resource_competencies" ADD CONSTRAINT "learning_resource_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmap_step_resources" ADD CONSTRAINT "career_roadmap_step_resources_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_roadmap_step_resources" ADD CONSTRAINT "career_roadmap_step_resources_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_competencies" ADD CONSTRAINT "opportunity_competencies_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_competencies" ADD CONSTRAINT "opportunity_competencies_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_competency_states" ADD CONSTRAINT "student_competency_states_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_competency_states" ADD CONSTRAINT "student_competency_states_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_step_progress" ADD CONSTRAINT "student_roadmap_step_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_roadmap_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_roadmap_step_progress" ADD CONSTRAINT "student_roadmap_step_progress_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_assessment_attempts" ADD CONSTRAINT "roadmap_assessment_attempts_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_roadmap_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_assessment_attempts" ADD CONSTRAINT "roadmap_assessment_attempts_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_assessment_attempts" ADD CONSTRAINT "roadmap_assessment_attempts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_practice_submissions" ADD CONSTRAINT "learning_practice_submissions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_roadmap_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_practice_submissions" ADD CONSTRAINT "learning_practice_submissions_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_practice_submissions" ADD CONSTRAINT "learning_practice_submissions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_practice_submissions" ADD CONSTRAINT "learning_practice_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_evidence" ADD CONSTRAINT "roadmap_evidence_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_roadmap_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_evidence" ADD CONSTRAINT "roadmap_evidence_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_evidence" ADD CONSTRAINT "roadmap_evidence_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_evidence" ADD CONSTRAINT "roadmap_evidence_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "competencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_stage_transitions" ADD CONSTRAINT "roadmap_stage_transitions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_roadmap_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_items" ADD CONSTRAINT "portfolio_items_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placements" ADD CONSTRAINT "placements_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_wallets" ADD CONSTRAINT "company_wallets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyWalletId_fkey" FOREIGN KEY ("companyWalletId") REFERENCES "company_wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_chamaWalletId_fkey" FOREIGN KEY ("chamaWalletId") REFERENCES "chama_wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_escrow_holds" ADD CONSTRAINT "opportunity_escrow_holds_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_members" ADD CONSTRAINT "chama_members_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "chamas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_members" ADD CONSTRAINT "chama_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_wallets" ADD CONSTRAINT "chama_wallets_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "chamas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chama_whitelisted_payees" ADD CONSTRAINT "chama_whitelisted_payees_chamaId_fkey" FOREIGN KEY ("chamaId") REFERENCES "chamas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_invites" ADD CONSTRAINT "project_team_invites_inviterUserId_fkey" FOREIGN KEY ("inviterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_invites" ADD CONSTRAINT "project_team_invites_inviteeUserId_fkey" FOREIGN KEY ("inviteeUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_sessions" ADD CONSTRAINT "call_sessions_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campus_managers" ADD CONSTRAINT "campus_managers_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

