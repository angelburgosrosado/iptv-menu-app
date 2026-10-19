# IPTV.Menu Pro — Production Readiness & Living Room TV Operations Manual

This document provides the canonical production release roadmap, hardware and network requirements for **Amazon Fire TV** and **Android TV** deployments, customer sideload procedures, and developer source distribution architecture for **IPTV.Menu Pro**.

---

## 1. Master Production Readiness Checklist

This master checklist covers every infrastructure, security, billing, packaging, and distribution requirement to take IPTV.Menu Pro live.

### Phase 1: Cloud Infrastructure & Network Security
- [ ] **Custom Domain & SSL/TLS Configuration**
  - Point canonical domain `iptv.menu` and API subdomain `api.iptv.menu` to production cluster (Cloudflare, AWS CloudFront, or Vercel Edge).
  - Enforce TLS 1.3 / HTTPS-only redirection with HTTP Strict Transport Security (`HSTS`).
- [ ] **CORS & Origin Lockdown**
  - In production `.env`, set `ALLOWED_ORIGINS="https://iptv.menu"` to prevent unauthorized third-party players from freeloading on the universal stream proxy.
  - Verify that preflight `OPTIONS` requests to `/api/stream/proxy` return `204 No Content` with appropriate headers.
- [ ] **Universal Stream Relay & Proxy Scaling**
  - Deploy the Express proxy service behind Nginx or Caddy with chunked transfer encoding enabled (`proxy_buffering off;`).
  - Set `ALLOW_LOCAL_PROXY=false` to enforce strict SSRF blocking against local loopbacks (`127.0.0.1`), LAN subnets (`192.168.0.0/16`, `10.0.0.0/8`), and cloud metadata services (`169.254.169.254`).
- [ ] **Redis / In-Memory Session Caching**
  - Connect Redis for caching parsed XMLTV EPG data, Xtream Codes token heartbeats, and channel health stats to minimize upstream provider load.

### Phase 2: Database & Storage Hardening
- [ ] **Production Neon PostgreSQL Migration**
  - Run database migration: `npm run db:push` to ensure tables (`users`, `workspaces`, `playlists`, `epg_feeds`, `app_configs`, `tv_pairings`, `audit_logs`) are created.
  - Ensure connection pooling is active with SSL enabled (`sslmode=require`).
- [ ] **Google Cloud Storage (GCS) / Blob Buckets**
  - Provision isolated storage buckets for user playlist uploads, sanitized outputs, and compiled APK artifacts:
    - `GCS_UPLOAD_BUCKET` (Private with signed URL access)
    - `GCS_OUTPUT_BUCKET` (Processed playlist cache)
    - `GCS_BUILD_BUCKET` (Compiled mobile/TV APK distribution)
- [ ] **Firebase Authentication & Rules Audit**
  - Replace test credentials with production Firebase Admin Service Account (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
  - Deploy locked Firestore security rules for multi-tenant workspace isolation.

### Phase 3: Stripe Billing & Subscription Gateways
- [ ] **Stripe Production API Keys**
  - Replace sandbox keys with live production keys: `STRIPE_SECRET_KEY` (`sk_live_...`) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`).
- [ ] **Webhook Endpoint Registration**
  - Configure live webhook listener at `https://iptv.menu/api/billing/webhook`.
  - Add `STRIPE_WEBHOOK_SECRET` (`whsec_...`) to environment variables.
  - Verify automated subscription provisioning for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.

### Phase 4: Mobile & Living Room TV APK Release
- [ ] **Production Keystore Generation**
  - Generate a secure 4096-bit RSA keystore for code-signing:
    ```bash
    keytool -genkeypair -v -keystore iptv-menu-pro.keystore -alias iptvmenu -keyalg RSA -keysize 4096 -validity 10000
    ```
- [ ] **Expo Application Services (EAS) Release Compilation**
  - Compile the universal production APK:
    ```bash
    cd mobile
    npm run build:apk:prod
    ```
- [x] **APK Hosting & Direct Distribution**
  - Compiled release APK uploaded and verified on Expo EAS / AWS S3 (`78.8 MB`), mirrored to `public/IPTV-Menu-Pro.apk`, and routed via `APK_DOWNLOAD_URL`.
- [x] **AFTVnews Downloader Shortcut Code Registration**
  - Registered direct URL `https://iptv-api-6xqo.onrender.com/api/download/latest.apk` on [AFTVnews Link Shortener](https://link.aftvnews.com).
  - Verified numeric shortcode **`3739589`** (and short URL `http://aftv.news/3739589`) redirects directly to the production APK download.

### Phase 5: Client Portal & Source Code Distribution
- [x] **Public Download API Verification**
  - Verified `GET /api/public/downloads` returns 200 with platform catalog.
  - Verified `GET /api/download/latest.apk` and `/download/latest.apk` redirect directly to the APK.
  - Verified `GET /api/download/source.zip` and `/download/source.zip` serve or redirect to the repository source archive.
- [x] **Frontend Download Page (`/download`)**
  - Confirmed `/download` renders the platform cards, copyable shortcode `3739589`, direct APK download buttons, and source code archive download.

---

## 2. Amazon Fire TV & Android TV Requirements & Setup Guide

### Hardware Requirements
| Parameter | Minimum Requirement | Recommended Specification |
|---|---|---|
| **Certified Devices** | Fire TV Stick (3rd Gen / 4K 1st Gen), Chromecast HD | Fire TV Stick 4K Max (2nd Gen), NVIDIA Shield TV Pro 4K, Fire TV Cube (3rd Gen), Formuler Z11 Pro Max |
| **Processor / Architecture** | ARMv7 (32-bit `armeabi-v7a`) | ARMv8 (64-bit `arm64-v8a`) quad-core 2.0GHz+ |
| **System Memory (RAM)** | 1.5 GB RAM | 2.0 GB – 3.0 GB RAM |
| **Available Storage** | 200 MB free internal flash | 500 MB+ free internal flash |
| **Display & HDMI** | 1080p @ 60Hz HDMI 1.4 | 4K UHD @ 60Hz HDMI 2.0b / 2.1 with HDCP 2.2 |
| **Hardware Codecs** | H.264 (AVC), MPEG-2 | HEVC (H.265) 10-bit, AV1, VP9 Profile 2, Dolby Vision / HDR10+ |

### Network & Connectivity Requirements
* **Bandwidth**:
  * **HD Live TV (1080p60)**: Consistent 15–25 Mbps download.
  * **4K UHD Cinema / Sports**: Consistent 50–100 Mbps download.
* **Connection Type**:
  * 5 GHz Wi-Fi (802.11ac / Wi-Fi 6) or wired 100/1000 Mbps Ethernet adapter.
  * *Notice: Avoid 2.4 GHz Wi-Fi due to RF congestion and dropped MPEG-TS UDP packets.*
* **Network Latency & Jitter**: Ping under 50ms to the stream gateway with jitter under 10ms to prevent buffer underruns.

### Software & Operating System Requirements
* **Operating System**: Fire OS 7, 8 (Android 9/10/11) or Android TV OS 9.0 through 14.0.
* **Input Device**: Standard television remote with 5-way D-Pad (Up, Down, Left, Right, OK/Select), Back, Home, and Options buttons.

---

## 3. Customer Living Room Sideload Walkthrough (60 Seconds)

Provide these exact instructions to customers installing **IPTV.Menu Pro** on their living room devices:

```
┌────────────────────────────────────────────────────────────────────────┐
│               HOW TO INSTALL ON FIRE TV & ANDROID TV                   │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Step 1             │ Step 2             │ Step 3                       │
│ Enable Developer   │ Open Downloader    │ Launch & Pair                │
│ Options & Install  │ Enter code: 3739589│ Scan QR or enter TV code     │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

### Step 1: Enable Sideloading Permissions
1. On your Fire TV or Android TV home screen, open **Settings** (gear icon) > **My Fire TV** (or **Device & Software**).
2. If **Developer Options** is not visible:
   - Select **About**.
   - Highlight your device name and click the **Center/Select button 7 times** rapidly until a banner says: *"You are now a developer."*
3. Go back one screen into **Developer Options** > **Install Unknown Apps**.
4. Find **Downloader** and toggle it to **ON**.

### Step 2: Download with Code 3739589
1. Search for **Downloader** (orange icon by AFTVnews) in the Amazon Appstore or Google Play Store and install it.
2. Launch Downloader, accept storage permissions, and navigate to the URL entry box.
3. Type the numeric code:
   ```text
   3739589
   ```
   *(or enter short URL: `aftv.news/3739589` or direct URL: `iptv-api-6xqo.onrender.com/api/download/latest.apk`)*
4. Click **Go**. Downloader will connect and download `IPTV-Menu-Pro.apk`.

### Step 3: Install & Launch
1. When prompted by the system dialog, click **Install**.
2. Once installation completes, click **Open** to launch **IPTV.Menu Pro**.

### Step 4: Frictionless TV Pairing (No Remote Typing Required)
1. On first launch, the TV displays a **6-Digit TV Pairing Code** and **QR Code**.
2. Open `https://iptv.menu/pair` on your phone or laptop.
3. Enter the 6-digit code. Your Xtream Codes credentials, M3U playlists, and favorites will instantly sync to your TV screen.

---

## 4. Client & Source Code Distribution Endpoints

The application includes unauthenticated endpoints to serve both binary installers and developer source packages:

| Endpoint | Method | Format | Description |
|---|---|---|---|
| `/api/public/downloads` | `GET` | JSON | Full device catalog, app version (v1.2.0), Downloader code, and setup instructions. |
| `/api/download/latest.apk` | `GET` | Binary APK / 302 | Serves `public/IPTV-Menu-Pro.apk` (or redirects to `$APK_DOWNLOAD_URL` or GitHub release). |
| `/download/latest.apk` | `GET` | Binary APK / 302 | Shortcode alias for television sideloaders. |
| `/api/download/source.zip` | `GET` | ZIP Archive / 302 | Direct download of complete TypeScript source code archive. |
| `/download/source.zip` | `GET` | ZIP Archive / 302 | Direct short alias for source code download. |

### Web Client Download Page (`/download`)
The `/download` view in `src/components/DesktopDownloads.tsx` provides:
1. **Direct Android APK Button**: Instant 1-tap download of the compiled client.
2. **Direct Source Code Button**: 1-tap download of `iptv-menu-pro-main.zip`.
3. **Copyable TV Downloader Code**: Interactive widget for code `3739589` (and short URL `http://aftv.news/3739589`).
4. **Git Clone Command Box**: 1-click clipboard copy of `git clone https://github.com/angelburgosrosado/iptv-menu-app.git`.
5. **Developer Build Matrix**: Quick reference cards for local web dev (`npm run dev`), APK build (`cd mobile && npm run build:apk`), and testing (`npm test`).

---

## 5. Verification & Testing Runbook

Execute this verification sequence prior to each production release:

```bash
# 1. Run full unit and integration test suite (293+ tests)
npm test

# 2. Check mobile client TypeScript typing
cd mobile && npx tsc --noEmit && cd ..

# 3. Build optimized production web client
npm run build:web

# 4. Verify public download endpoints locally
curl -I http://localhost:3001/api/public/downloads
curl -I http://localhost:3001/api/download/latest.apk
curl -I http://localhost:3001/api/download/source.zip
```
