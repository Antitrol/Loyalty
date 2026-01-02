# İkas Loyalty Widget - Integration Guide

## 📦 Widget Overview

The İkas Loyalty Widget is a lightweight, customer-facing component that displays loyalty points, tier progress, and redemption options on your storefront.

**Features:**
- ✨ Floating badge design (minimal, non-intrusive)
- 📊 Real-time point balance display  
- 🏆 Tier level and progress tracking
- 💰 One-click point redemption
- 📱 Fully responsive (mobile-friendly)
- 🎨 Customizable colors and positioning

---

## 🚀 Quick Start (2 Minutes)

### Step 1: Add the Embed Script

Add this code to your İkas theme's `<head>` or before the closing `</body>` tag:

```html
<script>
  window.IKAS_LOYALTY_CONFIG = {
    apiUrl: 'https://your-loyalty-app.vercel.app',
    position: 'bottom-right',
    autoExpand: false
  };
</script>
<script src="https://your-loyalty-app.vercel.app/widget/embed.js" async></script>
```

### Step 2: Configure (Optional)

```javascript
window.IKAS_LOYALTY_CONFIG = {
  // Your loyalty app URL (REQUIRED)
  apiUrl: 'https://your-app.vercel.app',
  
  // Widget position (OPTIONAL, default: 'bottom-right')
  // Options: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  position: 'bottom-right',
  
  // Auto-expand on page load (OPTIONAL, default: false)
  autoExpand: false
};
```

### Step 3: Done! 🎉

The widget will automatically:
- Detect logged-in customers
- Fetch their loyalty data
- Display their points and tier
- Allow them to redeem points

---

## 🎨 Customization

### Theme Colors

Widget colors are automatically pulled from your Loyalty Settings in the admin panel:

**Admin Panel → Loyalty Settings:**
- `Widget Primary Color` - Main accent color
- `Widget Label` - Point label (e.g., "Puan", "Coin", "Stars")

No code changes needed!

### Position

Change widget position via configuration:

```javascript
window.IKAS_LOYALTY_CONFIG = {
  apiUrl: 'https://your-app.vercel.app',
  position: 'bottom-left' // Move to bottom-left
};
```

**Available Positions:**
- `bottom-right` (default) - Bottom right corner
- `bottom-left` - Bottom left corner  
- `top-right` - Top right corner
- `top-left` - Top left corner

---

## 🔧 Advanced Configuration

### Customer ID Detection

The widget automatically detects the logged-in customer through:

1. **İkas App Bridge** (if available)
2. **localStorage** (`ikas_customer`)
3. **URL parameter** (for testing: `?customerId=123`)

### Manual Customer ID

If you need to manually set the customer ID:

```html
<script>
  // Set customer ID before widget loads
  localStorage.setItem('ikas_customer', JSON.stringify({
    id: 'your-customer-id'
  }));
</script>
```

---

## 🧪 Testing

### Test with URL Parameter

For development/testing, you can pass the customer ID via URL:

```
https://your-store.com?customerId=cm4pkb8fj000i1vq27ktfh24p
```

### Test States

**Logged Out State:**
- Widget shows "Giriş Yap" button
- Clicking redirects to login page

**Logged In State:**
- Widget shows points and tier
- Expandable on click
- Shows redemption button (if eligible)

**Error State:**
- Widget shows warning icon
- Check browser console for errors

---

## 📱 Mobile Optimization

Widget is fully responsive:
- Smaller size on mobile (<768px)
- Touch-friendly buttons (min 44px)
- Optimized badge positioning
- Scrollable expanded view

No additional configuration needed!

---

## 🎯 Point Redemption Flow

1. Customer clicks widget → Expands
2. Sees "Kullanılabilir: X₺" section
3. Clicks "Puan Kullan" button
4. Confirmation prompt appears
5. Redirects to redemption page

**Note:** Currently uses browser confirm dialog. In future versions, we'll add a custom modal.

---

## 🔐 Security

### CORS Configuration

The widget makes API calls to your loyalty app. Ensure CORS is properly configured:

**In your Next.js app:**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/widget/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Or specific domains
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
        ],
      },
    ];
  },
};
```

### Data Privacy

- Widget only displays data for the logged-in customer
- No sensitive data exposed  
- Customer ID validated server-side
- HTTPS-only in production

---

## 🐛 Troubleshooting

### Widget Not Showing

**Check:**
1. Is `IKAS_LOYALTY_CONFIG.apiUrl` correct?
2. Open browser console - any errors?
3. Is customer logged in?
4. Check Network tab - API calls successful?

**Debug:**
```javascript
// Add to console
console.log(window.IKAS_LOYALTY_CONFIG);
console.log(localStorage.getItem('ikas_customer'));
```

### Wrong Customer Data

**Check:**
1. Customer ID detection method
2. Browser console for logged customer ID
3. API response in Network tab

### Styling Conflicts

If widget conflicts with your theme CSS:

```css
/* Add to your theme CSS */
#ikas-loyalty-widget {
  all: initial; /* Reset all styles */
}
```

### Mobile Issues

**Check:**
- Widget position on small screens
- Button tap targets (min 44px)
- Viewport meta tag present

---

## 📊 Analytics

Track widget interactions (optional):

```javascript
// Listen to widget events
document.addEventListener('loyalty-widget-expanded', function() {
  // Track expansion
  gtag('event', 'loyalty_widget_expand');
});

document.addEventListener('loyalty-widget-redeem-click', function() {
  // Track redemption intent
  gtag('event', 'loyalty_redeem_click');
});
```

**Note:** Event tracking will be added in next version.

---

## 🔄 Updates

Widget auto-updates when you deploy new versions! No merchant action needed.

**Versioning:**
- Widget script URL doesn't change
- Cache-busting via query param (future)
- Breaking changes will be documented

---

## 📞 Support

**Issues?**
- Email: support@yourapp.com
- Documentation: [Link to docs]
- GitHub Issues: [Link if public]

**Response Time:** Within 24 hours

---

## 📝 Changelog

### v1.0.0 (2026-01-02)
- ✨ Initial release
- 🎨 Floating badge design
- 📊 Tier progress display
- 💰 Point redemption
- 📱 Mobile responsive

---

## ✅ Checklist for Merchants

Before going live:

- [ ] Embed script added to theme
- [ ] API URL configured correctly
- [ ] Tested on desktop
- [ ] Tested on mobile
- [ ] Customer can see their points
- [ ] Redemption flow works
- [ ] Colors match your brand (optional)
- [ ] Position looks good

---

**Questions?** Contact us at support@yourapp.com

**Happy loyalty building! 🎉**
