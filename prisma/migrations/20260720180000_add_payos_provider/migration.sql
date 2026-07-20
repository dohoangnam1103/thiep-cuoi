-- Keep existing Casso payments intact while allowing new payments to use payOS.
ALTER TABLE "Payment" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'casso';
ALTER TABLE "Payment" ADD COLUMN "providerOrderCode" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerPaymentLinkId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerCheckoutUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerQrCode" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerBankBin" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerBankAccount" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerBankAccountName" TEXT;

CREATE UNIQUE INDEX "Payment_providerOrderCode_key" ON "Payment"("providerOrderCode");
CREATE UNIQUE INDEX "Payment_providerPaymentLinkId_key" ON "Payment"("providerPaymentLinkId");
CREATE INDEX "Payment_provider_status_idx" ON "Payment"("provider", "status");
