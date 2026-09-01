INSERT INTO "feature_flags" ("key", "enabled", "description", "createdAt", "updatedAt")
VALUES (
  'evergreen.enabled',
  TRUE,
  'Release control for Zumbarl Evergreen API and workspaces.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
