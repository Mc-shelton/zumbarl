LOCK TABLE "wallets" IN SHARE ROW EXCLUSIVE MODE;

WITH wallet_groups AS (
  SELECT
    "studentId",
    "type",
    MIN("id") AS keep_id,
    SUM("balance") AS total_balance,
    SUM("pendingBalance") AS total_pending_balance
  FROM "wallets"
  GROUP BY "studentId", "type"
), duplicate_wallets AS (
  SELECT wallet."id" AS duplicate_id, wallet_groups.keep_id
  FROM "wallets" wallet
  JOIN wallet_groups
    ON wallet_groups."studentId" = wallet."studentId"
   AND wallet_groups."type" = wallet."type"
  WHERE wallet."id" <> wallet_groups.keep_id
)
UPDATE "transactions" transaction
SET "walletId" = duplicate_wallets.keep_id
FROM duplicate_wallets
WHERE transaction."walletId" = duplicate_wallets.duplicate_id;

WITH wallet_groups AS (
  SELECT
    "studentId",
    "type",
    MIN("id") AS keep_id,
    SUM("balance") AS total_balance,
    SUM("pendingBalance") AS total_pending_balance
  FROM "wallets"
  GROUP BY "studentId", "type"
)
UPDATE "wallets" wallet
SET
  "balance" = wallet_groups.total_balance,
  "pendingBalance" = wallet_groups.total_pending_balance
FROM wallet_groups
WHERE wallet."id" = wallet_groups.keep_id;

WITH wallet_groups AS (
  SELECT "studentId", "type", MIN("id") AS keep_id
  FROM "wallets"
  GROUP BY "studentId", "type"
)
DELETE FROM "wallets" wallet
USING wallet_groups
WHERE wallet."studentId" = wallet_groups."studentId"
  AND wallet."type" = wallet_groups."type"
  AND wallet."id" <> wallet_groups.keep_id;

CREATE UNIQUE INDEX "wallets_studentId_type_key" ON "wallets"("studentId", "type");
