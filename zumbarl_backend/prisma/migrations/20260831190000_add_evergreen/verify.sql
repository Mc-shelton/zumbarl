-- Run after the migration. Every query must return zero rows.

-- Existing placement rows were preserved and received compatible defaults.
SELECT "id"
FROM "placements"
WHERE "status" IS NULL OR "currency" IS NULL OR "version" IS NULL OR "updatedAt" IS NULL;

-- No cohort can exceed capacity or have invalid counters.
SELECT "id"
FROM "evergreen_cohorts"
WHERE "seatCount" <= 0
   OR "reservedSeats" < 0
   OR "filledSeats" < 0
   OR "reservedSeats" > "seatCount"
   OR "filledSeats" > "seatCount";

-- Current locks are exclusive for both student and placement.
SELECT "studentId"
FROM "active_placement_locks"
GROUP BY "studentId"
HAVING COUNT(*) > 1;

SELECT "placementId"
FROM "active_placement_locks"
GROUP BY "placementId"
HAVING COUNT(*) > 1;

-- Accepted offers and placements agree on the student and company.
SELECT p."id"
FROM "placements" p
JOIN "placement_offers" o ON o."id" = p."offerId"
WHERE p."studentId" <> o."studentId" OR p."companyId" <> o."companyId";

-- A finance-confirmed invoice is the only invoice state that may source an active entitlement.
SELECT e."id"
FROM "evergreen_entitlements" e
JOIN "evergreen_invoices" i ON i."id" = e."sourceInvoiceId"
WHERE e."status" = 'ACTIVE' AND i."status" <> 'CONFIRMED';
