-- CreateTable
CREATE TABLE "AuthToken" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "authorizedAppId" TEXT,
    "salesChannelId" TEXT,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "accessToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    "expireDate" TIMESTAMP(3) NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "scope" TEXT,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION,
    "metadata" JSONB,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyBalance" (
    "customerId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyBalance_pkey" PRIMARY KEY ("customerId")
);

-- CreateTable
CREATE TABLE "LoyaltySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "earnPerAmount" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "earnUnitAmount" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "earnRatio" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "welcomeBonus" INTEGER NOT NULL DEFAULT 0,
    "excludeShipping" BOOLEAN NOT NULL DEFAULT false,
    "excludeDiscounted" BOOLEAN NOT NULL DEFAULT false,
    "categoryBonuses" JSONB,
    "tiers" JSONB,
    "burnRatio" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "minSpendLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxPointUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "widgetPrimaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "widgetLabel" TEXT NOT NULL DEFAULT 'Puan',
    "widgetSecondaryColor" TEXT NOT NULL DEFAULT '#818CF8',
    "widgetTheme" TEXT NOT NULL DEFAULT 'light',
    "widgetPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "widgetStyle" TEXT NOT NULL DEFAULT 'default',
    "widgetAnimations" BOOLEAN NOT NULL DEFAULT true,
    "widgetAutoExpand" BOOLEAN NOT NULL DEFAULT false,
    "widgetBorderRadius" INTEGER NOT NULL DEFAULT 16,
    "widgetShadowIntensity" TEXT NOT NULL DEFAULT 'medium',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_authorizedAppId_key" ON "AuthToken"("authorizedAppId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyBalance_customerId_key" ON "LoyaltyBalance"("customerId");
