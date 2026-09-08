ALTER TABLE "marketplace_shops"
ADD COLUMN "errandFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "marketplace_shops" AS shop
SET "errandFee" = rates."feeAmount"
FROM (
  SELECT "shopId", MIN("feeAmount") AS "feeAmount"
  FROM "errand_shop_registrations"
  WHERE "status" = 'ACTIVE'
  GROUP BY "shopId"
) AS rates
WHERE shop."id" = rates."shopId";

ALTER TABLE "errand_shop_registrations"
DROP COLUMN "feeAmount";
