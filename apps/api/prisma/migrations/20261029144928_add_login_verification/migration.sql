-- CreateTable
CREATE TABLE "login_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challengeToken" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "login_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_verifications_challengeToken_key" ON "login_verifications"("challengeToken");

-- CreateIndex
CREATE INDEX "login_verifications_userId_idx" ON "login_verifications"("userId");

-- AddForeignKey
ALTER TABLE "login_verifications" ADD CONSTRAINT "login_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
