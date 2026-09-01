ALTER TABLE "connect_posts" ADD COLUMN "communityGroupId" TEXT;
CREATE INDEX "connect_posts_communityGroupId_status_createdAt_idx" ON "connect_posts"("communityGroupId", "status", "createdAt");
ALTER TABLE "connect_posts" ADD CONSTRAINT "connect_posts_communityGroupId_fkey" FOREIGN KEY ("communityGroupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH first_members AS (
  SELECT DISTINCT ON (m."groupId") m."groupId", m."id", m."studentId"
  FROM "community_group_memberships" m
  INNER JOIN "community_groups" g ON g."id" = m."groupId"
  WHERE g."category" = 'support-circle'
    AND m."status" = 'active'
    AND m."studentId" IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM "community_group_memberships" a
      WHERE a."groupId" = m."groupId" AND a."status" = 'active' AND a."role" = 'admin'
    )
  ORDER BY m."groupId", m."createdAt" ASC
)
UPDATE "community_group_memberships" m
SET "role" = 'admin', "updatedAt" = CURRENT_TIMESTAMP
FROM first_members f
WHERE m."id" = f."id";

WITH first_admins AS (
  SELECT DISTINCT ON (m."groupId") m."groupId", m."studentId"
  FROM "community_group_memberships" m
  INNER JOIN "community_groups" g ON g."id" = m."groupId"
  WHERE g."category" = 'support-circle'
    AND m."status" = 'active'
    AND m."role" = 'admin'
    AND m."studentId" IS NOT NULL
  ORDER BY m."groupId", m."createdAt" ASC
)
UPDATE "community_groups" g
SET "ownerStudentId" = f."studentId", "updatedAt" = CURRENT_TIMESTAMP
FROM first_admins f
WHERE g."id" = f."groupId" AND g."ownerStudentId" IS NULL;
