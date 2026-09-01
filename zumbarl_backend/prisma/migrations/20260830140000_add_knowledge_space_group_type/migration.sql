ALTER TABLE "knowledge_spaces"
ADD COLUMN "groupType" TEXT;

UPDATE "knowledge_spaces"
SET "groupType" = 'STUDY_GROUP'
WHERE "type" = 'GROUP' AND "groupType" IS NULL;
