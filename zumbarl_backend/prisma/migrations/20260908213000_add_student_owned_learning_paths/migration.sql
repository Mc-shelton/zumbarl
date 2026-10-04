ALTER TABLE "career_roadmaps"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'PLATFORM',
ADD COLUMN "createdByStudentId" TEXT;

CREATE TABLE "student_roadmap_resources" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "matchedSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "refreshedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_roadmap_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "student_roadmap_resources_enrollmentId_resourceId_key"
ON "student_roadmap_resources"("enrollmentId", "resourceId");

CREATE INDEX "student_roadmap_resources_enrollmentId_status_idx"
ON "student_roadmap_resources"("enrollmentId", "status");

CREATE INDEX "student_roadmap_resources_resourceId_idx"
ON "student_roadmap_resources"("resourceId");

CREATE INDEX "student_roadmap_resources_stepId_idx"
ON "student_roadmap_resources"("stepId");

ALTER TABLE "student_roadmap_resources"
ADD CONSTRAINT "student_roadmap_resources_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "student_roadmap_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_roadmap_resources"
ADD CONSTRAINT "student_roadmap_resources_resourceId_fkey"
FOREIGN KEY ("resourceId") REFERENCES "learning_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "student_roadmap_resources"
ADD CONSTRAINT "student_roadmap_resources_stepId_fkey"
FOREIGN KEY ("stepId") REFERENCES "career_roadmap_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
