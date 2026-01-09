-- First, check if the customer exists
SELECT * FROM "LoyaltyBalance" WHERE "customerId" = 'b7ed7574-a51e-47a7-b0d4-d39f10fb2455';

-- Insert or update customer with 2000 points
INSERT INTO "LoyaltyBalance" ("customerId", "points", "updatedAt")
VALUES ('b7ed7574-a51e-47a7-b0d4-d39f10fb2455', 2000, NOW())
ON CONFLICT ("customerId") 
DO UPDATE SET 
  "points" = 2000,
  "updatedAt" = NOW();

-- Verify the update
SELECT * FROM "LoyaltyBalance" WHERE "customerId" = 'b7ed7574-a51e-47a7-b0d4-d39f10fb2455';
