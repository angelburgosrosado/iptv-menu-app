# IPTV.MENU Production Launch Checklist & Google Ads Integration Guide

This document is the master operational checklist for taking **IPTV.menu** live in production and establishing your **Google Ads tracking and acquisition campaigns**.

---

## Part 1: Final Production Launch Checklist

### 1. Domain, DNS & Network Routing
- [ ] **Custom Domain Binding:**
  - `iptv.menu` apex domain mapped via A records (`76.76.21.21` or Vercel recommended IP).
  - `www.iptv.menu` configured as CNAME pointing to `cname.vercel-dns.com`.
  - Canonical domain configured (e.g. 301 redirect `www` to apex `https://iptv.menu` or vice versa).
- [ ] **SSL / TLS Certificate:**
  - Automated Let's Encrypt / Vercel SSL active and green for all SANs (`iptv.menu`, `*.iptv.menu`).
  - HSTS header enabled (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
- [ ] **SPA Fallback & Routing:**
  - [`vercel.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/vercel.json) rewrites rule (`"source": "/(.*)", "destination": "/index.html"`) active to prevent 404s on browser reloads on deep links.

---

### 2. Frontend Application (Vite / React 19)
- [ ] **Production Build Validation:**
  - Run `npm run build` and ensure zero TypeScript errors or missing chunks.
  - Ensure all mock and test overrides in local storage or preview states are disabled by default.
- [ ] **PWA & Service Worker:**
  - Check [`index.html`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/index.html) and [`public/manifest.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/public/manifest.json).
  - Verify service worker caching policy: cache static assets, but bypass caching for `/api/*` and dynamic playlist streams.
- [ ] **SEO & Metadata:**
  - Meta tags, OpenGraph preview images (`og-image.jpg`), Twitter cards, and JSON-LD schema validated via Google Rich Results Test.
  - `robots.txt` and `sitemap.xml` deployed and pointing to `https://iptv.menu`.

---

### 3. Database Layer (Neon Serverless PostgreSQL)
- [ ] **Production Pooled Connection String:**
  - Ensure `DATABASE_URL` in Vercel and the Worker container uses the `-pooler` endpoint with PgBouncer:
    ```bash
    DATABASE_URL="postgresql://neondb_owner:[YOUR_NEON_PASSWORD]@ep-winter-poetry-ae51hoth-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    ```
- [ ] **Migrations & Table Verification:**
  - Verify all 7 tables exist and have appropriate primary keys and indexes:
    - `users` (indexed on `email`, `role`)
    - `workspaces` (indexed on `slug`, `owner_id`)
    - `playlists` (indexed on `workspace_id`, `status`)
    - `playlist_runs` (indexed on `playlist_id`, `created_at`)
    - `epg_feeds` (indexed on `workspace_id`)
    - `build_requests` (indexed on `workspace_id`, `status`)
    - `admin_actions` (audit log)
- [ ] **Connection Limits & Neon Autoscaling:**
  - Check Neon Compute units (CU) autoscaling limits (e.g. 0.25 to 2 CU).
  - Enable Neon Point-In-Time Restore (PITR) for disaster recovery.

---

### 4. Object Storage (Vercel Blob)
- [ ] **Blob Token Injected:**
  - `BLOB_READ_WRITE_TOKEN` set in Vercel Project Environment Variables and Railway/Render worker.
- [ ] **Bucket Permissions & Access Modes:**
  - Public read access for generated M3U playlists, XMLTV EPG feeds, and exported APK binaries.
  - Validate that file uploads work end-to-end via `/api/storage/upload`.

---

### 5. Backend REST API (`apps/api` on Vercel)
- [ ] **Environment Variables:**
  - `NODE_ENV=production`
  - `APP_ENV=production`
  - `FIREBASE_PROJECT_ID=iptv-menu-dev` (or production Firebase project)
  - `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` (properly escaped newlines `\n`).
- [ ] **CORS Configuration:**
  - Restrict allowed origins strictly to `https://iptv.menu` and `https://www.iptv.menu`.
- [ ] **Workspace Guard & Authentication:**
  - Verify `workspaceGuard.ts` ensures users cannot access or tamper with playlists/builds belonging to another workspace.
- [ ] **Rate Limiting:**
  - Set rate limit thresholds on `/api/billing/*`, `/api/auth/*`, and `/api/streams/*` to prevent abuse.

---

### 6. Background Worker Daemon (`apps/worker` on Railway / Render)
- [ ] **Container Deployment:**
  - Deploy Docker container using [`apps/worker/Dockerfile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/apps/worker/Dockerfile).
  - Check container health check and logs to confirm successful startup.
- [ ] **Queue Polling & Concurrency:**
  - Verify background jobs are running:
    - Stream availability probing (HEAD requests with timeout caps).
    - M3U deduplication & cleaning.
    - EPG / XMLTV generation.
    - EAS build status polling.
- [ ] **Memory & CPU Tuning:**
  - Allocate at least 1 GB RAM to worker container to handle parsing large multi-megabyte M3U playlists without Out-of-Memory (OOM) crashes.

---

### 7. Monetization & Billing (Stripe Live Mode)
- [ ] **Live Keys:**
  - Replace `pk_test_...` and `sk_test_...` with live production keys (`pk_live_...` and `sk_live_...`).
- [ ] **Production Price IDs:**
  - Create Products and Prices in the Stripe Live Dashboard:
    - **Pro Streamer Monthly:** `$9.99/month`
    - **Pro Streamer Yearly:** `$95.88/year` ($7.99/mo)
    - **App Builder Suite Monthly:** `$29.99/month`
    - **App Builder Suite Yearly:** `$287.88/year` ($23.99/mo)
  - Update environment variables or price mapping configuration.
- [ ] **Stripe Webhook Destination:**
  - Configure live endpoint in Stripe Dashboard:
    ```
    https://iptv.menu/api/billing/webhook
    ```
  - Subscribed events:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
  - Set `STRIPE_WEBHOOK_SECRET=whsec_...` in Vercel environment variables.
- [ ] **End-to-End Live Transaction Test:**
  - Perform a real $1.00 or test live charge to confirm user entitlement upgrade in Neon DB (`users.role = 'pro'` or `'builder'`).

---

### 8. Mobile APK & Expo EAS
- [ ] **Production APK Build:**
  - Run production build command:
    ```bash
    npm run build:apk:prod
    ```
  - Confirm generated APK download link is live and accessible.
- [ ] **Android Permissions & Network Security:**
  - Confirm `android.permission.INTERNET` and cleartext traffic settings in `mobile/app.json` for HTTP live stream compatibility.

---

### 9. Legal, DMCA & Policy Compliance
- [ ] **Terms of Service & Privacy Policy:**
  - Links live and accessible in the footer and [`LegalModal.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/LegalModal.tsx).
- [ ] **DMCA Notice & Disclaimers:**
  - Explicit statement that IPTV.menu is a media player, stream playlist editor, and protocol tool that **does not host, transmit, or sell copyrighted media streams**.
  - Designated copyright agent contact email published (`legal@iptv.menu` or `dmca@iptv.menu`).

---

## Part 2: Procedure to Add Information in Google Ads

Setting up Google Ads for a media player / IPTV playlist management tool requires precise conversion tracking and careful compliance positioning.

```
┌─────────────────────────────────────────────────────────────┐
│                       Google Ads Flow                       │
└─────────────────────────────────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
       [Google Tag Setup]             [Conversion Actions]
       - Gtag in index.html           - purchase (Stripe Checkout)
       - Link with GA4                - sign_up (User Register)
                                      - download_apk (App Install)
                               │
                               ▼
               [Campaign Setup & Compliance]
               - Focus on "Player & Stream Manager"
               - Exclude illegal/pirate keywords
               - Set negative keyword list
```

---

### Step 1: Create Account & Link Google Ecosystem

1. **Sign up or log in** to [Google Ads](https://ads.google.com).
2. **Complete Advertiser Verification:** Under **Tools & Settings** > **Billing & Payments** and **Advertiser Verification**, verify your business identity to prevent sudden campaign pauses.
3. **Link Google Analytics 4 (GA4):**
   - Go to **Tools and Settings** > **Linked Accounts** > **Google Analytics (GA4) and Firebase**.
   - Connect your GA4 property (`G-XXXXXXXXXX`). Enable **Import Google Analytics audiences and conversions**.

---

### Step 2: Install Google Tag (`gtag.js`) in the Web Application

Add your Google Tag to the `<head>` of [`index.html`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/index.html) directly above the existing Google AdSense script.

Replace `AW-1234567890` with your actual **Google Ads Tag ID (Measurement ID)**:

```html
<!-- Google Tag (gtag.js) for Google Ads & GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-1234567890"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  // Configure Google Ads Account
  gtag('config', 'AW-1234567890', {
    'allow_enhanced_conversions': true
  });
  
  // Configure GA4 Account (if applicable)
  // gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

### Step 3: Configure Conversion Actions in Google Ads

In the Google Ads console:
1. Navigate to **Goals** > **Conversions** > **Summary**.
2. Click **+ New conversion action** > Select **Website**.
3. Enter your domain: `https://iptv.menu` and click **Scan**.

Define the following 4 core conversion actions:

| Action Name | Category | Value | Counting | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Purchase_Pro_Builder** | Purchase | Use different values for each conversion ($9.99 / $29.99) | Every | Fires on successful Stripe checkout return (`?checkout=success`) |
| **User_Sign_Up** | Sign-up | $2.00 (optional static value) | One | Fires when a new user registers an account |
| **APK_Download** | Outbound Click / App Download | $1.00 (optional) | One | Fires when user clicks "Download APK" |
| **Playlist_Imported** | Lead / Engagement | None | One | Fires on first successful M3U or Xtream connection |

---

### Step 4: Implement Conversion Trigger Codes

#### A. Purchase Conversion (`?checkout=success`)
In your React application (or on checkout return handler in [`DesktopPremium.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopPremium.tsx)), fire the Google Ads conversion event:

```javascript
// Fire when URL contains ?checkout=success or upon Stripe webhook confirmation
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'conversion', {
    send_to: 'AW-1234567890/AbCdEfGhIjKlMnOpQrS', // Your Google Ads conversion label
    value: planPrice,                              // e.g. 9.99 or 29.99
    currency: 'USD',
    transaction_id: sessionOrTxId                  // Stripe session ID to prevent deduplication
  });
}
```

#### B. User Sign-up Conversion
In [`src/components/AuthModal.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/AuthModal.tsx) after successful registration:

```javascript
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'sign_up', {
    method: isGoogle ? 'Google' : 'Email'
  });
  window.gtag('event', 'conversion', {
    send_to: 'AW-1234567890/SignUpConversionLabel'
  });
}
```

#### C. Android APK Download Conversion
In [`src/components/DesktopApkBuilder.tsx`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/src/components/DesktopApkBuilder.tsx) or download button:

```javascript
const handleDownloadClick = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: 'AW-1234567890/ApkDownloadLabel'
    });
  }
  window.open(url, '_blank');
};
```

---

### Step 5: Critical Google Ads Compliance Policy for IPTV Apps

> [!CAUTION]
> **Avoid Account Suspension:** Google Ads has strict policies prohibiting "Enabling Dishonest Behavior" and "Copyright Infringement". **Never advertise unverified live TV stream subscriptions or channel lists.**

Follow these ad copywriting and targeting rules:

#### ✅ Safe / Compliant Keywords & Messaging:
- **Product Category:** Media Player, M3U Playlist Editor, Xtream Codes Client, TV Guide / EPG Synchronizer.
- **Allowed Keywords:**
  - `iptv player for pc`
  - `m3u8 player app`
  - `smart tv iptv player`
  - `xtream codes player android`
  - `epg tv guide synchronizer`
  - `playlist stream health checker`
- **Recommended Headlines:**
  - *IPTV Menu Pro - Smart M3U & M3U8 Player*
  - *Clean & Organize Stream Playlists*
  - *High-Performance Live Stream Player*
  - *Auto EPG & Multi-Screen Matrix*
- **Recommended Descriptions:**
  - *Fast, cross-platform media player for your personal M3U8 playlists and Xtream accounts. Try free.*
  - *Validate stream health, organize channel categories, and auto-sync EPG schedules seamlessly.*

#### ❌ Banned / Prohibited Keywords (Add as Negative Keywords):
Add the following as **Negative Keywords** across all campaigns to prevent accidental policy violations and poor-quality traffic:
- `free iptv channels`
- `cracked iptv`
- `buy iptv subscription`
- `unlimited cable channels`
- `free sky channels`
- `pirate tv`
- `firestick hack`
- `m3u free download 2026`

---

### Step 6: Campaign Creation & Bidding Strategy

1. **Campaign Type:**
   - Start with a **Search Campaign** targeting high-intent desktop and mobile users searching for player software.
2. **Geo-Targeting:**
   - Target tier-1 regions first (United States, Canada, United Kingdom, European Union) or regions with high IPTV media player usage.
3. **Bidding Strategy:**
   - **Phase 1 (First 2-3 weeks):** Select **Maximize Clicks** with a Maximum CPC bid limit (e.g. $0.40 - $0.80) to gather initial traffic and conversion data.
   - **Phase 2 (After 30+ recorded conversions):** Switch to **Maximize Conversions** or **Target CPA** (e.g. Target CPA of $8.00 for Pro upgrade or $2.00 for Sign-up).
4. **Ad Extensions (Assets):**
   - **Sitelinks:** "Features & Performance", "Pro Pricing", "Download APK", "EPG & TV Guide".
   - **Callout Assets:** "60 FPS Hardware Decoding", "Cloud Playlist Sync", "Multi-Screen 4x4 View", "No Ads on Pro".
   - **Structured Snippets:** Types: *Web Player, Android APK, Xtream Codes, XMLTV Guide*.

---

### Step 7: Testing & Verification with Google Tag Assistant

1. Open [Google Tag Assistant](https://tagassistant.google.com).
2. Enter `https://iptv.menu`.
3. Verify that:
   - The Google Tag (`AW-XXXXXXXXX`) is detected with a green checkmark.
   - Page views record properly on load.
   - Click a test action (e.g. Download APK or Sign Up) and verify that the corresponding conversion event fires in the Tag Assistant timeline.
4. In Google Ads, check **Goals > Conversions** after 24 hours to confirm the status changes from *"Unverified"* to *"No recent conversions"* or *"Recording conversions"*.
