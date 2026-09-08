ALTER TABLE "marketplace_shops"
ADD COLUMN "errandsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "errandFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE "errand_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "errand_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_errands" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "assignedErranderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "pickupLabel" TEXT NOT NULL,
    "dropoffLabel" TEXT NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "payload" JSONB,
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "marketplace_errands_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "errand_responses" (
    "id" TEXT NOT NULL,
    "errandId" TEXT NOT NULL,
    "erranderId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "errand_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "errand_enrollments_studentId_key" ON "errand_enrollments"("studentId");
CREATE INDEX "errand_enrollments_campusId_isAvailable_idx" ON "errand_enrollments"("campusId", "isAvailable");
CREATE UNIQUE INDEX "marketplace_errands_orderId_shopId_key" ON "marketplace_errands"("orderId", "shopId");
CREATE INDEX "marketplace_errands_campusId_status_createdAt_idx" ON "marketplace_errands"("campusId", "status", "createdAt");
CREATE INDEX "marketplace_errands_assignedErranderId_status_idx" ON "marketplace_errands"("assignedErranderId", "status");
CREATE UNIQUE INDEX "errand_responses_errandId_erranderId_key" ON "errand_responses"("errandId", "erranderId");
CREATE INDEX "errand_responses_erranderId_createdAt_idx" ON "errand_responses"("erranderId", "createdAt");

ALTER TABLE "errand_enrollments" ADD CONSTRAINT "errand_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_errands" ADD CONSTRAINT "marketplace_errands_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_errands" ADD CONSTRAINT "marketplace_errands_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "marketplace_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "marketplace_errands" ADD CONSTRAINT "marketplace_errands_assignedErranderId_fkey" FOREIGN KEY ("assignedErranderId") REFERENCES "student_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "errand_responses" ADD CONSTRAINT "errand_responses_errandId_fkey" FOREIGN KEY ("errandId") REFERENCES "marketplace_errands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "errand_responses" ADD CONSTRAINT "errand_responses_erranderId_fkey" FOREIGN KEY ("erranderId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
