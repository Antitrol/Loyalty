/**
 * Manual GraphQL Test Script
 * Tests listCoupon query directly with browser token
 */

// 1. İKAS admin panelde devtools aç (F12)
// 2. Console'a şunu yapıştır:

// Auth token al
const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
console.log('Token:', authToken);

// listCoupon query test et
fetch('https://api.myikas.com/api/v2/admin/graphql', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({
        query: `
      query {
        listCoupon(pagination: { limit: 10, page: 1 }) {
          count
          hasNext
          page
          data {
            id
            code
            campaignId
            usageCount
            usageLimit
            deleted
          }
        }
      }
    `
    })
})
    .then(r => r.json())
    .then(data => {
        console.log('✅ SUCCESS!');
        console.log('Total coupons:', data.data?.listCoupon?.count);
        console.log('Coupons:', data.data?.listCoupon?.data);

        if (data.errors) {
            console.log('❌ Error:', data.errors);
        }
    })
    .catch(err => console.error('❌ Failed:', err));
