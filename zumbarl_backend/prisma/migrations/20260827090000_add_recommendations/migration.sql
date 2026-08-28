CREATE TABLE "recommendation_events" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "reward" DOUBLE PRECISION NOT NULL,
    "position" INTEGER,
    "sessionId" TEXT,
    "features" JSONB,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recommendation_model_artifacts" (
    "id" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metrics" JSONB,
    "featureSchema" JSONB,
    "trainedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_model_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recommendation_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "surface" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "reason" JSONB,
    "modelArtifactId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_scores_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "recommendation_events_studentId_surface_occurredAt_idx"
    ON "recommendation_events"("studentId", "surface", "occurredAt");
CREATE INDEX "recommendation_events_surface_entityType_entityId_occurr_idx"
    ON "recommendation_events"("surface", "entityType", "entityId", "occurredAt");
CREATE INDEX "recommendation_events_eventType_occurredAt_idx"
    ON "recommendation_events"("eventType", "occurredAt");
CREATE UNIQUE INDEX "recommendation_model_artifacts_surface_version_key"
    ON "recommendation_model_artifacts"("surface", "version");
CREATE INDEX "recommendation_model_artifacts_surface_status_activatedAt_idx"
    ON "recommendation_model_artifacts"("surface", "status", "activatedAt");
CREATE UNIQUE INDEX "recommendation_scores_studentId_surface_entityType_entity_key"
    ON "recommendation_scores"("studentId", "surface", "entityType", "entityId");
CREATE INDEX "recommendation_scores_studentId_surface_rank_idx"
    ON "recommendation_scores"("studentId", "surface", "rank");
CREATE INDEX "recommendation_scores_surface_entityType_entityId_idx"
    ON "recommendation_scores"("surface", "entityType", "entityId");
CREATE INDEX "recommendation_scores_expiresAt_idx"
    ON "recommendation_scores"("expiresAt");

ALTER TABLE "recommendation_events"
    ADD CONSTRAINT "recommendation_events_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_scores"
    ADD CONSTRAINT "recommendation_scores_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recommendation_scores"
    ADD CONSTRAINT "recommendation_scores_modelArtifactId_fkey"
    FOREIGN KEY ("modelArtifactId") REFERENCES "recommendation_model_artifacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
