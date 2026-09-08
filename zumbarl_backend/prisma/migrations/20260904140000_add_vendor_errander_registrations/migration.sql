ALTER TABLE "marketplace_shops"
ADD COLUMN "acceptingErranders" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "errand_shop_registrations" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "flagReason" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "errand_shop_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "errand_shop_registrations_shopId_studentId_key"
ON "errand_shop_registrations"("shopId", "studentId");

CREATE INDEX "errand_shop_registrations_studentId_status_idx"
ON "errand_shop_registrations"("studentId", "status");

CREATE INDEX "errand_shop_registrations_shopId_status_joinedAt_idx"
ON "errand_shop_registrations"("shopId", "status", "joinedAt");

ALTER TABLE "errand_shop_registrations"
ADD CONSTRAINT "errand_shop_registrations_shopId_fkey"
FOREIGN KEY ("shopId") REFERENCES "marketplace_shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "errand_shop_registrations"
ADD CONSTRAINT "errand_shop_registrations_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
