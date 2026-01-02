# Dashboard Functionality Test Plan

## Test Session
**Date:** 2025-12-31
**Environment:** Development (Cloudflare Tunnel)
**Tunnel URL:** `https://republicans-usual-upgrades-throat.trycloudflare.com`

---

## Test 1: Settings Persistence ⚡ **PRIORITY**

### Test Case 1.1: Save Basic Settings
**Steps:**
1. Open Dashboard → Settings tab
2. Modify earning rules (e.g., earnPerAmount = 2)
3. Click "Değişiklikleri Kaydet"
4. Verify success message

**Expected:**
- Success alert shown
- No console errors
- `/api/settings` POST returns 200

**Actual:**
- [ ] Tested
- Result: 

### Test Case 1.2: Settings Reload
**Steps:**
1. After saving, close İkas app
2. Reopen app
3. Check if settings values are preserved

**Expected:**
- Previously saved values displayed
- `/api/settings` GET returns saved data

**Actual:**
- [ ] Tested
- Result:

---

## Test 2: Tier Configuration

### Test Case 2.1: View Tier Settings
**Steps:**
1. Navigate to Tier Settings section
2. Verify default tiers displayed

**Expected:**
- 5 tiers shown (Standard, Bronze, Silver, Gold, Platinum)
- Each tier has threshold and multiplier

**Actual:**
- [ ] Tested
- Result:

### Test Case 2.2: Modify Tier Values
**Steps:**
1. Change Bronze threshold to 10000
2. Change Silver multiplier to 1.5
3. Save settings

**Expected:**
- Values update in UI
- Saved to database

**Actual:**
- [ ] Tested
- Result:

---

## Test 3: Category Bonuses

### Test Case 3.1: Add Category Bonus
**Steps:**
1. Find category bonus section
2. Add a test category with multiplier
3. Save

**Expected:**
- Category saved
- Persists on reload

**Actual:**
- [ ] Tested
- Result:

---

## Test 4: Customers/CRM Page

### Test Case 4.1: View Customers List
**Steps:**
1. Navigate to "Müşteriler (CRM)" tab
2. Check customer list loads

**Expected:**
- Customer list displayed
- `/api/customers` returns data

**Actual:**
- [ ] Tested
- Result:

### Test Case 4.2: Adjust Customer Points
**Steps:**
1. Click "Düzenle" on a customer
2. Add/remove points
3. Save

**Expected:**
- Points updated
- Transaction recorded

**Actual:**
- [ ] Tested
- Result:

---

## Test 5: Statistics Page

### Test Case 5.1: View Stats
**Steps:**
1. Navigate to "İstatistikler" tab
2. Check metrics display

**Expected:**
- Total customers count
- Total points distributed

**Actual:**
- [ ] Tested
- Result:

---

## Test 6: API Endpoints (Backend)

### Test Case 6.1: Settings API
```bash
# GET
curl https://[tunnel-url]/api/settings \
  -H "Authorization: JWT [token]"

# POST
curl https://[tunnel-url]/api/settings \
  -X POST \
  -H "Authorization: JWT [token]" \
  -H "Content-Type: application/json" \
  -d '{"earnPerAmount": 2}'
```

**Expected:**
- GET returns current settings
- POST saves and returns updated settings

### Test Case 6.2: Customers API
```bash
curl https://[tunnel-url]/api/customers \
  -H "Authorization: JWT [token]"
```

**Expected:**
- Returns array of customers with points

---

## Known Issues from Previous Session

**Issue:** Settings not persisting on reload
**Status:** **TO BE TESTED**
**Possible Cause:** 
- Cache issue
- API not returning saved data
- Frontend state management

---

## Test Execution Order

1. ✅ Dashboard loads
2. ⏳ Settings save & persistence
3. ⏳ Tier configuration
4. ⏳ Customer list
5. ⏳ Statistics display

---

## How to Report Results

For each test, user should:
1. Try the action
2. Note success/failure
3. Check browser console for errors
4. Share screenshots if issues found

**I will guide step-by-step!**
