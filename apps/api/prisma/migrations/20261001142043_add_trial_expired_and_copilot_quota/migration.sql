-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIAL_EXPIRED';

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "copilotRequestsUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "copilot_usage_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "durationMs" INTEGER NOT NULL,
    "toolsUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copilot_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copilot_usage_logs_organizationId_idx" ON "copilot_usage_logs"("organizationId");

-- CreateIndex
CREATE INDEX "copilot_usage_logs_createdAt_idx" ON "copilot_usage_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "copilot_usage_logs" ADD CONSTRAINT "copilot_usage_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
