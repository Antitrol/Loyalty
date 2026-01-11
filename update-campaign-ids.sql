-- Update LoyaltySettings with İKAS Campaign IDs
-- Run this SQL in Supabase SQL Editor

UPDATE "LoyaltySettings"
SET 
    "campaign100Id" = '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0',
    "campaign250Id" = '95f1d418-1ed1-4a6c-8cac-d66a25499518',
    "campaign500Id" = '2ef154c7-659a-466c-a8f7-27eb8cd1a099',
    "campaign1000Id" = 'f032252a-9285-4ae6-a979-d50d68018318',
    "autoCreateCampaigns" = true
WHERE id = 'default';

-- Verify the update
SELECT "campaign100Id", "campaign250Id", "campaign500Id", "campaign1000Id", "autoCreateCampaigns"
FROM "LoyaltySettings"
WHERE id = 'default';
