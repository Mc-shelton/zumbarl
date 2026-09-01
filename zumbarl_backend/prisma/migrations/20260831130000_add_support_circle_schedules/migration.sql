ALTER TABLE "community_group_messages"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'message',
ADD COLUMN "payload" JSONB;

CREATE TABLE "community_group_schedules" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "createdByStudentId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'audio_circle',
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "community_group_schedules_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "community_group_schedules_groupId_startsAt_idx" ON "community_group_schedules"("groupId", "startsAt");
CREATE INDEX "community_group_schedules_createdByStudentId_idx" ON "community_group_schedules"("createdByStudentId");
ALTER TABLE "community_group_schedules" ADD CONSTRAINT "community_group_schedules_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "community_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
