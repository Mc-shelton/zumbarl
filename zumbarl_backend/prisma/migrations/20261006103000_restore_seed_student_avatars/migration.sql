-- Early demo seeds assigned one stock image to every project candidate and
-- re-applied it on each seed run. Restore the newest avatar each seed user
-- uploaded for themselves; users without an owned profile-avatar upload fall
-- back to the bee in the client by keeping avatarUrl null.
UPDATE "student_profiles" AS profile
SET "avatarUrl" = (
  SELECT upload."url"
  FROM "uploaded_files" AS upload
  WHERE upload."ownerId" = profile."userId"
    AND upload."scope" = 'profile'
    AND upload."status" = 'complete'
    AND upload."metadata"->>'purpose' = 'profile-avatar'
  ORDER BY upload."createdAt" DESC
  LIMIT 1
)
FROM "users" AS app_user
WHERE app_user."id" = profile."userId"
  AND app_user."email" IN (
    'student@zumbarl.test',
    'brian.otieno@zumbarl.test',
    'grace.wanjiku@zumbarl.test',
    'kevin.mutua@zumbarl.test'
  )
  AND EXISTS (
    SELECT 1
    FROM "uploaded_files" AS seed_upload
    WHERE seed_upload."url" = profile."avatarUrl"
      AND seed_upload."isSeed" = true
      AND seed_upload."metadata"->>'source' = 'seedDatabase'
      AND seed_upload."metadata"->>'publicAssetPath' = '/assets/index/business_page_images/optimized/cowomen-ZKHksse8tUU-unsplash.webp'
  );
