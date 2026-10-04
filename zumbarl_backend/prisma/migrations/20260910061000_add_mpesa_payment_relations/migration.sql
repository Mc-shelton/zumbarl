ALTER TABLE "mpesa_payment_requests"
ADD CONSTRAINT "mpesa_payment_requests_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mpesa_payment_requests"
ADD CONSTRAINT "mpesa_payment_requests_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mpesa_payment_requests"
ADD CONSTRAINT "mpesa_payment_requests_opportunityId_fkey"
FOREIGN KEY ("opportunityId") REFERENCES "opportunities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mpesa_payment_requests"
ADD CONSTRAINT "mpesa_payment_requests_transactionId_fkey"
FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
