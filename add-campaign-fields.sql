-- Manual migration: Add campaign tier fields to LoyaltySettings
-- Run this if prisma migrate fails

ALTER TABLE "LoyaltySettings" 
ADD COLUMN IF NOT EXISTS "campaign100Id" TEXT,
ADD COLUMN IF NOT EXISTS "campaign250Id" TEXT,
ADD COLUMN IF NOT EXISTS "campaign500Id" TEXT,
ADD COLUMN IF NOT EXISTS "campaign1000Id" TEXT,
ADD COLUMN IF NOT EXISTS "autoCreateCampaigns" BOOLEAN DEFAULT true;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'LoyaltySettings' 
AND column_name LIKE 'campaign%';
