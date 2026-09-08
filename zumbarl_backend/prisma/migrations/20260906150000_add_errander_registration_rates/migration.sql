ALTER TABLE "errand_shop_registrations"
ADD COLUMN "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE "errand_shop_registrations" AS registration
SET "feeAmount" = shop."errandFee"
FROM "marketplace_shops" AS shop
WHERE registration."shopId" = shop."id";

ALTER TABLE "marketplace_shops"
DROP COLUMN "errandFee";
