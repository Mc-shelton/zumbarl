CREATE TABLE "outbox_consumer_receipts" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "consumer" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "result" JSONB,
  CONSTRAINT "outbox_consumer_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "outbox_consumer_receipts_eventId_consumer_key"
  ON "outbox_consumer_receipts"("eventId", "consumer");

CREATE INDEX "outbox_consumer_receipts_consumer_processedAt_idx"
  ON "outbox_consumer_receipts"("consumer", "processedAt");

ALTER TABLE "outbox_consumer_receipts"
  ADD CONSTRAINT "outbox_consumer_receipts_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "outbox_events"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
