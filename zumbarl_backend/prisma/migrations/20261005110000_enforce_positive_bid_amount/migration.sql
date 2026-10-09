-- A submitted zero bid used to mean "use the opportunity budget", but storing
-- the sentinel leaked KES 0 into applicant and payment screens. Materialize the
-- real amount before enforcing the invariant for all future writes.
UPDATE "bids" AS bid
SET "bidAmount" = opportunity."budgetAmount"
FROM "opportunities" AS opportunity
WHERE bid."opportunityId" = opportunity."id"
  AND bid."bidAmount" IS NOT NULL
  AND bid."bidAmount" <= 0
  AND opportunity."budgetAmount" > 0;

UPDATE "bids"
SET "bidAmount" = NULL
WHERE "bidAmount" IS NOT NULL
  AND "bidAmount" <= 0;

ALTER TABLE "bids"
ADD CONSTRAINT "bids_bidAmount_positive_or_null"
CHECK ("bidAmount" IS NULL OR "bidAmount" > 0);
