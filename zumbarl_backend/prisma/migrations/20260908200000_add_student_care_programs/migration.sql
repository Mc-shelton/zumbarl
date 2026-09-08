CREATE TABLE "student_care_programs" (
  "id" TEXT NOT NULL,
  "campusId" TEXT,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "facilitatorName" TEXT NOT NULL,
  "providerType" TEXT NOT NULL DEFAULT 'campus_support',
  "requiresProfessionalReferral" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'active',
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "capacity" INTEGER,
  "steps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_care_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_care_program_enrollments" (
  "id" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "supportCaseId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'requested',
  "goal" TEXT NOT NULL,
  "privacyMode" TEXT NOT NULL DEFAULT 'private',
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "consentedAt" TIMESTAMP(3) NOT NULL,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "nextCheckInAt" TIMESTAMP(3),
  "lastCheckInAt" TIMESTAMP(3),
  "assignedToUserId" TEXT,
  "studentVisibleNote" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "student_care_program_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_care_progress" (
  "id" TEXT NOT NULL,
  "enrollmentId" TEXT NOT NULL,
  "recordedByUserId" TEXT,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "note" TEXT,
  "studentVisible" BOOLEAN NOT NULL DEFAULT true,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "student_care_progress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_care_programs_campusId_status_category_idx" ON "student_care_programs"("campusId", "status", "category");
CREATE UNIQUE INDEX "student_care_program_enrollments_programId_studentId_key" ON "student_care_program_enrollments"("programId", "studentId");
CREATE INDEX "student_care_program_enrollments_studentId_status_idx" ON "student_care_program_enrollments"("studentId", "status");
CREATE INDEX "student_care_program_enrollments_assignedToUserId_status_idx" ON "student_care_program_enrollments"("assignedToUserId", "status");
CREATE INDEX "student_care_progress_enrollmentId_occurredAt_idx" ON "student_care_progress"("enrollmentId", "occurredAt");

ALTER TABLE "student_care_programs" ADD CONSTRAINT "student_care_programs_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "campuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_care_program_enrollments" ADD CONSTRAINT "student_care_program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "student_care_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_care_program_enrollments" ADD CONSTRAINT "student_care_program_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_care_progress" ADD CONSTRAINT "student_care_progress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "student_care_program_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
