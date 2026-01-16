-- Update campaign ID for 100 points tier (1 TL)
UPDATE "LoyaltySettings" 
SET "campaign100Id" = '2bc1f3dc-ae46-42c3-9cb5-c00279e69bf0'
WHERE id = 'default';

-- Verify
SELECT "campaign100Id", "campaign250Id", "campaign500Id", "campaign1000Id" 
FROM "LoyaltySettings" 
WHERE id = 'default';
