CREATE TABLE "mpesa_payment_requests" (
    "id" TEXT NOT NULL,
    "direction" "MpesaDirection" NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "phoneNumber" TEXT NOT NULL,
    "companyId" TEXT,
    "studentId" TEXT,
    "opportunityId" TEXT,
    "payoutId" TEXT,
    "clientReference" TEXT NOT NULL,
    "accountReference" TEXT NOT NULL,
    "callbackTokenHash" TEXT NOT NULL,
    "merchantRequestId" TEXT,
    "checkoutRequestId" TEXT,
    "conversationId" TEXT,
    "originatorConversationId" TEXT,
    "providerReceipt" TEXT,
    "resultCode" INTEGER,
    "resultDescription" TEXT,
    "transactionId" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "callbackPayload" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastQueriedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mpesa_payment_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mpesa_payment_requests_clientReference_key" ON "mpesa_payment_requests"("clientReference");
CREATE UNIQUE INDEX "mpesa_payment_requests_merchantRequestId_key" ON "mpesa_payment_requests"("merchantRequestId");
CREATE UNIQUE INDEX "mpesa_payment_requests_checkoutRequestId_key" ON "mpesa_payment_requests"("checkoutRequestId");
CREATE UNIQUE INDEX "mpesa_payment_requests_conversationId_key" ON "mpesa_payment_requests"("conversationId");
CREATE UNIQUE INDEX "mpesa_payment_requests_providerReceipt_key" ON "mpesa_payment_requests"("providerReceipt");
CREATE UNIQUE INDEX "mpesa_payment_requests_transactionId_key" ON "mpesa_payment_requests"("transactionId");
CREATE INDEX "mpesa_payment_requests_status_requestedAt_idx" ON "mpesa_payment_requests"("status", "requestedAt");
CREATE INDEX "mpesa_payment_requests_companyId_idx" ON "mpesa_payment_requests"("companyId");
CREATE INDEX "mpesa_payment_requests_studentId_idx" ON "mpesa_payment_requests"("studentId");
CREATE INDEX "mpesa_payment_requests_opportunityId_idx" ON "mpesa_payment_requests"("opportunityId");
