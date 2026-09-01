CREATE TABLE "community_group_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_group_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "community_group_messages_groupId_createdAt_idx" ON "community_group_messages"("groupId", "createdAt");
CREATE INDEX "community_group_messages_studentId_idx" ON "community_group_messages"("studentId");

ALTER TABLE "community_group_messages"
ADD CONSTRAINT "community_group_messages_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
