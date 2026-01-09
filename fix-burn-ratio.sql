-- Fix burnRatio: 100 points = 1 TL (not 1 point = 0.01 TL)
UPDATE "LoyaltySettings" 
SET "burnRatio" = 100 
WHERE id = 'default';

-- Verify the update
SELECT "burnRatio", "earnRatio", "earnPerAmount", "earnUnitAmount" FROM "LoyaltySettings" WHERE id = 'default';
