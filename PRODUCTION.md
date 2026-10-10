# ONLYCREATION — Production Architecture & Deployment Runbook

This document details the production architecture, security model, deployment steps, and operations for ONLYCREATION.

---

## 1. System Architecture Overview

ONLYCREATION operates as an authoritative full-stack platform:
- **Frontend SPA**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Backend Core**: Express server (`server.ts`) running authoritative business logic, payment verification, double-entry immutable ledgers, and AI proxying.
- **Database & Auth**: Firebase Authentication & Google Cloud Firestore with role-based security rules (`firestore.rules`).
- **Payment Layer**: Dual-gateway architecture (Razorpay standard for India, Stripe for international), webhook signature validation, and immutable double-entry ledger bookkeeping.
- **AI Gateway**: Server-side proxy for `@google/genai` with `gemini-3.8-flash`, enforcing per-user rate limiting (15 req/min) and daily quotas (50 generations/day).

---

## 2. Wallet & Immutable Ledger System

### Collections
1. `wallets/{uid}`
   - `availableBalance`: number
   - `pendingBalance`: number
   - `totalEarned`: number
   - `currency`: 'INR' | 'OC_CREDIT'
   - `updatedAt`: ISO String
   - `version`: integer
   - **Security**: Client read-only (`allow read: if isOwner(userId) || isAdmin()`). Writes are strictly forbidden from the client and only allowed via authoritative server endpoints.

2. `ledgerEntries/{entryId}`
   - `id`: unique entry ID (`ledger_<timestamp>_<hash>`)
   - `uid`: user / creator UID
   - `type`: `'deposit' | 'booking_payment' | 'dispatch_payment' | 'payout' | 'refund' | 'tip' | 'adjustment'`
   - `amount`: positive number
   - `currency`: `'INR' | 'OC_CREDIT'`
   - `direction`: `'credit' | 'debit'`
   - `balanceAfter`: authoritative wallet balance following transaction
   - `status`: `'settled' | 'pending' | 'failed' | 'reversed'`
   - `relatedOrderId`: order reference ID
   - `relatedPayoutId`: payout reference ID
   - `createdAt`: ISO timestamp
   - `createdBy`: `'system'`
   - **Security**: Client read-only for their own transactions. Immutable; no client updates or deletions permitted.

### Future-Proof Token & Blockchain Architecture
- All ledger and wallet math uses an abstracted currency unit (`INR` or `OC_CREDIT`).
- The 1:1 mapping guarantees that when launching the OnlyCreation Token on an EVM Layer 2 (e.g. Base, Polygon, Arbitrum), user balances map 1:1 without database migrations or schema adjustments.
- The UI contains a dedicated L2 token card in the Wallet center.

---

## 3. Endpoints & Server API

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Health status and service configuration check |
| `/api/ai/generate` | POST | Authenticated Gemini proxy with rate-limiting & per-user quota |
| `/api/ai/analyze-health` | POST | Project milestone risk & health analysis |
| `/api/payments/create-order` | POST | Server-side order creation (Razorpay / Stripe / HMAC Sandbox) |
| `/api/payments/verify` | POST | Cryptographic signature verification, payment logging & ledger crediting |
| `/api/payments/webhook` | POST | Webhook listener for `order.paid`, `payment.captured`, `charge.refunded` |
| `/api/wallet/deposit-order` | POST | Authoritative deposit order creation |
| `/api/wallet/verify-deposit` | POST | Verified wallet deposit credit & ledger generation |
| `/api/wallet/pay-from-wallet` | POST | Instant 1-click checkout using available wallet balance |
| `/api/wallet/payout` | POST | Server-authoritative partner payout request via instant IMPS |

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env` and populate the keys:

```bash
# Gemini AI
GEMINI_API_KEY="AIzaSy..."

# Razorpay (India Standard)
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Stripe (Global)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Security
WEBHOOK_SECRET="your_secure_random_hmac_secret"
ADMIN_BOOTSTRAP_TOKEN="your_secure_admin_bootstrap_key"
```

---

## 5. Webhook Setup Guide

### Razorpay Webhook Configuration:
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/) > Settings > Webhooks.
2. Add Webhook URL: `https://<YOUR_APP_URL>/api/payments/webhook`.
3. Secret: Enter the secret defined in `RAZORPAY_WEBHOOK_SECRET`.
4. Subscribe to Active Events:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`

### Stripe Webhook Configuration:
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/) > Developers > Webhooks.
2. Add Endpoint URL: `https://<YOUR_APP_URL>/api/payments/webhook`.
3. Select Events: `checkout.session.completed`, `charge.refunded`, `payment_intent.succeeded`.
4. Copy Signing Secret into `STRIPE_WEBHOOK_SECRET`.

---

## 6. Admin Bootstrapping & Access Control

1. Create your administrative account through the app (`LoginModal` or Firebase Auth).
2. During initial setup, the first admin document `/admins/{uid}` is created via the initial bootstrap phase.
3. Once bootstrapped, all subsequent admin promotions must be approved by existing admins via the `/admin` dashboard.
4. Client role manipulation is strictly prevented by `firestore.rules`:
   ```javascript
   function isAdmin() { 
     return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid)); 
   }
   ```

---

## 7. Cloud Deployment (Firebase Hosting + Cloud Run / Functions)

### Build
```bash
npm run build
```

### Full-Stack Run / Container
```bash
# In production container:
npm run start
```

### Firebase Deploy (Firestore Rules & Indexes)
```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```
