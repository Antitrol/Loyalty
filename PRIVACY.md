# Loyalty App - Data Privacy & Processing Policy

**Version:** 1.0  
**Last Updated:** January 2, 2026  
**Applicable Laws:** GDPR (EU), KVKK (Turkey)

---

## 📊 Overview

This document describes how our Loyalty Application ("the App") collects, processes, stores, and protects customer data when integrated with İkas e-commerce stores.

---

## 🔍 What Customer Data We Collect

### Data Stored in İkas Platform (Customer Tags)

We use İkas's native tagging system to store loyalty-related information:

| Tag | Purpose | Example |
|-----|---------|---------|
| `Loyalty:Points:XXX` | Current point balance | `Loyalty:Points:150` |
| `Loyalty:Tier:XXX` | Customer tier level | `Loyalty:Tier:Gold` |
| `Loyalty:Lifetime:XXX` | Total points ever earned | `Loyalty:Lifetime:800` |

**Why Tags?**
- ✅ Native İkas feature
- ✅ Visible to merchants
- ✅ Easily reversible
- ✅ No custom schema required

### Data Stored in Our Database

We maintain our own database to ensure performance and reliability:

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Customer ID | Link to İkas customer | Permanent (until deletion) |
| First Name, Last Name | Display purposes | Synced from İkas |
| Email Address | Notifications (optional) | Synced from İkas |
| Point Balance | Backup of İkas tags | Real-time sync |
| Transaction History | Audit trail | 2 years |
| Timestamps | Compliance tracking | Permanent |

---

## ❌ What We DO NOT Collect

We explicitly **DO NOT** collect, store, or process:

- ❌ Credit card or payment information
- ❌ Passwords or authentication credentials
- ❌ Full addresses (we may read city/country for display only)
- ❌ Phone numbers
- ❌ Date of birth
- ❌ Government-issued ID numbers
- ❌ Any sensitive personal data per GDPR Article 9

---

## 🎯 How We Use The Data

### Primary Uses

1. **Point Calculation**
   - Calculate loyalty points based on purchase amounts
   - Apply category bonuses and tier multipliers
   - Process point redemptions

2. **Tier Management**
   - Determine customer tier based on lifetime points
   - Apply tier-specific benefits

3. **Transaction Logging**
   - Maintain audit trail of all point transactions
   - Enable dispute resolution
   - Provide merchant reporting

4. **Dashboard Analytics**
   - Display aggregated statistics to merchants
   - Show customer loyalty profiles
   - Generate reports

### What We DO NOT Use Data For

- ❌ Marketing to customers (no emails, no ads)
- ❌ Selling to third parties
- ❌ Profiling beyond loyalty tier
- ❌ Behavioral tracking outside purchases
- ❌ Cross-store data sharing

---

## 🔐 Data Security

### Technical Measures

- 🔒 **Encryption in Transit:** All data transmitted via HTTPS/TLS
- 🔒 **Database Security:** SQLite with restricted access (dev), PostgreSQL with encryption at rest (prod)
- 🔒 **Authentication:** OAuth 2.0 for İkas API access
- 🔒 **Webhook Validation:** HMAC-SHA256 signature verification
- 🔒 **No PII in Logs:** Personal data never logged to console or files

### Organizational Measures

- 👥 Access to customer data limited to authorized personnel only
- 📝 Regular security audits
- 🔄 Automated backups with encryption
- 🚨 Incident response plan in place

---

## ⏰ Data Retention

### Active Customers

- Customer data retained as long as they remain active in İkas store
- Transaction history retained for **24 months** (legal requirement)

### Deleted Customers

When a customer is deleted from İkas:

1. **Immediate:** Point tags removed from İkas
2. **30 Days:** Soft delete in our database
3. **After 30 Days:** Permanent deletion from our database

### Merchant-Initiated Deletion

Merchants can request immediate data deletion for any customer via:
- Direct database cleanup (we provide tools)
- Support request (processed within 7 business days)

---

## 👤 Data Subject Rights (GDPR/KVKK)

Customers have the following rights:

### 1. Right to Access
Customers can request to see all data we hold about them.
- **Response Time:** 30 days
- **Format:** JSON export or readable report

### 2. Right to Rectification
Customers can request corrections to inaccurate data.
- **Process:** Merchant submits correction → We update within 7 days

### 3. Right to Erasure ("Right to be Forgotten")
Customers can request complete deletion.
- **Process:** See "Deleted Customers" section above
- **Exceptions:** Transaction history may be retained for legal compliance (up to 24 months)

### 4. Right to Data Portability
Customers can request their data in machine-readable format.
- **Format:** JSON export

### 5. Right to Object
Customers can object to data processing.
- **Result:** Points program disabled for that customer

---

## 📧 Exercising Rights

**For End Customers:**
1. Contact the store (merchant) where you shop
2. Merchant forwards request to us
3. We process within legal timeframes

**For Merchants:**
- Email: [YOUR-SUPPORT-EMAIL]
- Response Time: 7 business days

---

## 🌍 International Data Transfers

- **Primary Storage:** [Your server location, e.g., "EU (Frankfurt, Germany)"]
- **Backup Storage:** [If applicable]
- **Third-Party Services:** We only use İkas official APIs (data remains in İkas infrastructure)

No customer data is transferred outside of the EEA/Turkey without appropriate safeguards.

---

## 🔔 Changes to This Policy

We may update this policy from time to time. When we do:

1. Version number will be incremented
2. "Last Updated" date will be changed
3. Merchants will be notified via email
4. Customers can be notified by merchant (recommended)

---

## 📞 Contact & Data Protection Officer

**For Privacy Inquiries:**
- Email: [YOUR-DPO-EMAIL]
- Response Time: 7 business days

**For Data Breaches:**
- Emergency: [YOUR-EMERGENCY-CONTACT]
- We will notify affected parties within **72 hours** of breach discovery (GDPR requirement)

---

## ✅ Compliance Checklist

- [x] GDPR Article 5 (Lawfulness, fairness, transparency)
- [x] GDPR Article 6 (Lawful basis: Contract performance)
- [x] GDPR Article 15-22 (Data subject rights)
- [x] GDPR Article 32 (Security measures)
- [x] GDPR Article 33 (Breach notification)
- [x] KVKK Article 4 (Data processing principles)
- [x] KVKK Article 11 (Data subject rights)

---

## 📝 Legal Basis for Processing

Under GDPR Article 6 and KVKK Article 5, our legal basis for processing is:

1. **Contract Performance (Art. 6.1.b):** Processing necessary to provide loyalty services
2. **Legitimate Interest (Art. 6.1.f):** Fraud prevention, security, analytics

---

**Document Version:** 1.0  
**Effective Date:** January 2, 2026  
**Review Cycle:** Annual
