-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'LAUNCH_PROGRAM';

-- AlterTable
ALTER TABLE "copilot_usage_logs" ADD COLUMN     "cacheCreationInputTokens" INTEGER,
ADD COLUMN     "cacheReadInputTokens" INTEGER,
ADD COLUMN     "estimatedCostUsd" DECIMAL(10,6),
ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "copilot_user_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "requestsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copilot_user_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copilot_user_usage_userId_idx" ON "copilot_user_usage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "copilot_user_usage_userId_periodKey_key" ON "copilot_user_usage"("userId", "periodKey");

-- CreateIndex
CREATE INDEX "copilot_usage_logs_userId_idx" ON "copilot_usage_logs"("userId");

-- AddForeignKey
ALTER TABLE "copilot_usage_logs" ADD CONSTRAINT "copilot_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_user_usage" ADD CONSTRAINT "copilot_user_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
