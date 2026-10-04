ALTER TABLE "portfolio_items"
ADD COLUMN "projectId" TEXT,
ADD COLUMN "sourceFileUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN "showClientName" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "sharedPostId" TEXT;

UPDATE "portfolio_items"
SET "publishedAt" = "createdAt"
WHERE "isPublic" = true AND "publishedAt" IS NULL;

UPDATE "portfolio_items"
SET "sourceFileUrls" = "fileUrls";

CREATE INDEX "portfolio_items_status_publishedAt_idx"
ON "portfolio_items"("status", "publishedAt");

CREATE UNIQUE INDEX "portfolio_items_studentId_opportunityId_key"
ON "portfolio_items"("studentId", "opportunityId");

CREATE UNIQUE INDEX "portfolio_items_studentId_projectId_key"
ON "portfolio_items"("studentId", "projectId");

ALTER TABLE "portfolio_items"
ADD CONSTRAINT "portfolio_items_opportunityId_fkey"
FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
