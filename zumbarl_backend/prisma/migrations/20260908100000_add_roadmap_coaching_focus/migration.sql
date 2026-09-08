ALTER TABLE "student_roadmap_enrollments"
ADD COLUMN "practiceSkillIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "weeklyPracticeTarget" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN "coachingUpdatedAt" TIMESTAMP(3);
