CREATE TABLE "wellbeing_preferences" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "insightsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "reminderTime" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wellbeing_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellbeing_check_ins" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "mood" TEXT NOT NULL,
  "stressors" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "sleep" TEXT,
  "note" TEXT,
  "source" TEXT NOT NULL DEFAULT 'daily',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wellbeing_check_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellbeing_reset_sessions" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "breathingSeconds" INTEGER NOT NULL DEFAULT 0,
  "groundingCount" INTEGER NOT NULL DEFAULT 0,
  "focus" TEXT,
  "durationSeconds" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wellbeing_reset_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellbeing_conversations" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "title" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "riskLevel" TEXT NOT NULL DEFAULT 'none',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wellbeing_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellbeing_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL DEFAULT 'none',
  "actions" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wellbeing_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campus_wellbeing_resources" (
  "id" TEXT NOT NULL,
  "campusId" TEXT,
  "resourceType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "contactLabel" TEXT,
  "href" TEXT,
  "availability" TEXT,
  "isEmergency" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "campus_wellbeing_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wellbeing_preferences_studentId_key" ON "wellbeing_preferences"("studentId");
CREATE INDEX "wellbeing_check_ins_studentId_createdAt_idx" ON "wellbeing_check_ins"("studentId", "createdAt");
CREATE INDEX "wellbeing_reset_sessions_studentId_createdAt_idx" ON "wellbeing_reset_sessions"("studentId", "createdAt");
CREATE INDEX "wellbeing_conversations_studentId_updatedAt_idx" ON "wellbeing_conversations"("studentId", "updatedAt");
CREATE INDEX "wellbeing_messages_conversationId_createdAt_idx" ON "wellbeing_messages"("conversationId", "createdAt");
CREATE INDEX "campus_wellbeing_resources_campusId_status_sortOrder_idx" ON "campus_wellbeing_resources"("campusId", "status", "sortOrder");

ALTER TABLE "wellbeing_preferences" ADD CONSTRAINT "wellbeing_preferences_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wellbeing_check_ins" ADD CONSTRAINT "wellbeing_check_ins_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wellbeing_reset_sessions" ADD CONSTRAINT "wellbeing_reset_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wellbeing_conversations" ADD CONSTRAINT "wellbeing_conversations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wellbeing_messages" ADD CONSTRAINT "wellbeing_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "wellbeing_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "campus_wellbeing_resources" ADD CONSTRAINT "campus_wellbeing_resources_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
