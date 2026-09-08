ALTER TABLE "errand_shop_registrations"
ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT false;

UPDATE "errand_shop_registrations" AS registration
SET "isAvailable" = enrollment."isAvailable"
FROM "errand_enrollments" AS enrollment
WHERE registration."studentId" = enrollment."studentId"
  AND registration."status" = 'ACTIVE';

DROP INDEX "errand_enrollments_campusId_isAvailable_idx";

ALTER TABLE "errand_enrollments"
DROP COLUMN "isAvailable";

CREATE INDEX "errand_enrollments_campusId_idx"
ON "errand_enrollments"("campusId");
