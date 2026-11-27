-- CreateTable
CREATE TABLE "email_verification_codes" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "codeHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_codes_email_idx" ON "email_verification_codes"("email");

-- CreateIndex
CREATE INDEX "email_verification_codes_expiresAt_idx" ON "email_verification_codes"("expiresAt");
