# İkas Partner Portal Configuration

## Current Tunnel URL (Active)

**Tunnel URL:** `https://lewis-boxing-usr-girls.trycloudflare.com`

**Status:** ✅ ACTIVE AND WORKING

**Verified:** 2026-01-02 14:26

---

## İkas Partner Portal Settings

### Required Updates:

1. **App URL:**
   ```
   https://lewis-boxing-usr-girls.trycloudflare.com
   ```

2. **OAuth Callback/Redirect URI:**
   ```
   https://lewis-boxing-usr-girls.trycloudflare.com/api/oauth/callback/ikas
   ```

### Steps to Update:

1. Go to https://partners.ikas.com
2. Navigate to your application
3. Click **Settings** or **Configuration**
4. Update **App URL** field
5. Update **OAuth Redirect URI** / **Callback URL** field
6. **SAVE**

---

## After Update:

1. **Clear browser cache:** Ctrl + Shift + Delete
2. **Close İkas Admin** completely
3. **Open new tab** → İkas Admin
4. **Launch your app**

Dashboard should now load successfully!

---

## Important Notes:

⚠️ **This URL changes every time you restart the tunnel**
⚠️ Keep `start-tunnel.bat` running while testing
⚠️ For production, deploy to Vercel for stable URL
