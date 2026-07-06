-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN "repeatCustomerPrice" INTEGER NOT NULL DEFAULT 99000;

UPDATE "AppConfig" SET "repeatCustomerPrice" = 99000 WHERE "id" = 'default';
