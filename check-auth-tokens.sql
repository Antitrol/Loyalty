-- Check AuthToken table
SELECT 
    id,
    merchantId,
    authorizedAppId,
    deleted,
    createdAt,
    LEFT(accessToken, 20) as token_preview
FROM "AuthToken"
ORDER BY createdAt DESC
LIMIT 10;

-- Also check if there are any tokens with deleted=false
SELECT COUNT(*) as total_tokens,
       SUM(CASE WHEN deleted = false THEN 1 ELSE 0 END) as active_tokens
FROM "AuthToken";
