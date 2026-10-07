# DEPLOYMENT CHECKLIST — IPTV.MENU Production Release

This checklist details all required environment variables, build steps, security audits, monitoring metrics, and rollback procedures prior to promoting to production.

---

## 1. Environment Variables Configuration

The following environment variables must be configured in your hosting platform (Vercel, Cloud Run, AWS ECS, or Kubernetes):

### Critical Authentication & Security
- [ ] `JWT_SECRET`: A high-entropy random string (at least 64 hex characters or 32 bytes base64) used to sign and verify HMAC-SHA256 JWTs.
  ```bash
  # Generate in terminal:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] `DATABASE_URL`: Neon PostgreSQL pooled connection string with SSL enabled:
  ```
  postgresql://user:password@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
  ```
- [ ] `ALLOW_LOCAL_PROXY`: Must be set to `false` (or omitted) in production to enforce strict SSRF blocking.

### Storage & Google Cloud / Firebase
- [ ] `GCS_UPLOAD_BUCKET`: GCS bucket for user M3U uploads (e.g. `iptv-menu-uploads`).
- [ ] `GCS_OUTPUT_BUCKET`: GCS bucket for cleaned/validated M3U outputs (e.g. `iptv-menu-processed`).
- [ ] `GCS_BUILD_BUCKET`: GCS bucket for compiled APKs and generated XMLTV feeds (e.g. `iptv-menu-builds`).
- [ ] `FIREBASE_PROJECT_ID`: Firebase project identifier.
- [ ] `FIREBASE_CLIENT_EMAIL`: Service account email for administrative access.
- [ ] `FIREBASE_PRIVATE_KEY`: Service account private key (with escaped newlines).
- [ ] `BLOB_READ_WRITE_TOKEN`: (Optional) Required only if utilizing Vercel Blob storage instead of Google Cloud Storage.

### External Integrations & Monetization
- [ ] `STRIPE_SECRET_KEY`: Production Stripe secret API key (`sk_live_...`).
- [ ] `STRIPE_WEBHOOK_SECRET`: Production webhook signing secret (`whsec_...`).
- [ ] `EXPO_TOKEN`: Expo Application Services (EAS) deployment token for Android APK compilation.
- [ ] `NEXT_PUBLIC_ADSENSE_PUB_ID`: Approved Google AdSense publisher ID (`ca-pub-XXXXXXXXXXXXXXXX`).

---

## 2. Build & Release Pipeline Steps

### Step 1: Pre-Deployment Validation
Run the static analysis and full test suite:
```bash
npm run lint
cd mobile && npx tsc --noEmit && cd ..
npm test
```
*Expected: 0 type errors, 21 test files passing, 236 tests passing.*

### Step 2: Database Schema Migration
Ensure the remote Neon database has all current columns:
```bash
npm run db:push
```
*Verify that `users.password_hash` exists.*

### Step 3: Compile Monorepo Packages
```bash
npm run build:packages
```

### Step 4: Build API Server Bundle
```bash
npm run build:api:bundle
```
*Generates production standalone entrypoint at `api/server.cjs` for Vercel Serverless / Docker.*

### Step 5: Build Production Frontend Web App
```bash
npm run build
```
*Generates optimized web client in `dist/` with chunk splitting for IPTV datasets, video player, and admin suite.*

### Step 6: Deploy to Target Environments
- **Vercel Web & API**:
  ```bash
  vercel --prod
  ```
- **Firebase Hosting (Optional)**:
  ```bash
  npm run deploy:hosting
  ```
- **Android APK Build (EAS)**:
  ```bash
  npm run build:apk:prod
  ```

---

## 3. Post-Deployment Smoke Verification

Immediately following production deployment, run the following verification checks:

1. **Health Check**:
   ```bash
   curl -s -f https://<your-domain>/api/health
   # Must return HTTP 200 with {"status":"ok"}
   ```
2. **SSRF Blocking Verification**:
   ```bash
   curl -s https://<your-domain>/api/stream/proxy?url=http://169.254.169.254/
   # Must return HTTP 400 {"error":"Access to private or loopback addresses is prohibited"}
   ```
3. **CORS Headers**:
   ```bash
   curl -s -I -X OPTIONS https://<your-domain>/api/stream/proxy
   # Must return HTTP 204 with Access-Control-Allow-Origin: *
   ```
4. **Authentication Security**:
   - Register a new account via `/api/public/auth/register`.
   - Verify login with correct password succeeds and returns a valid 3-segment signed JWT.
   - Verify login with invalid password returns HTTP 401.
   - Verify that default credentials `Admin123` are rejected.

---

## 4. Monitoring & Telemetry

Configure alerts in your monitoring stack (Google Cloud Monitoring, Datadog, or Sentry):

- **Error Rates**: Alert if HTTP 5xx responses on `/api/stream/proxy` exceed 5% over a 5-minute rolling window.
- **SSRF Violation Attempts**: Log and count 400 responses with `"Access to private or loopback addresses is prohibited"`.
- **Database Connection Pool**: Monitor Neon connection count and latency; set pool limits to avoid exhausting serverless connection thresholds.
- **Worker Job Lag**: Monitor queue depth where `status = 'queued'` for `playlist_runs` and `epg_feeds`. Alert if queued duration exceeds 15 minutes.

---

## 5. Rollback Plan

If critical defects or regressions are discovered in production:

1. **Frontend / API Rollback**:
   - On Vercel: Promote the previous known-good deployment via the Vercel dashboard or CLI (`vercel rollback`).
   - On Container / Cloud Run: Update the traffic split to route 100% of traffic to the prior stable revision.
2. **Database Rollback**:
   - Schema modifications (`password_hash TEXT`) are backward-compatible and additive; no table or column drops are required during rollback.
3. **Cache Invalidation**:
   - Flush CDN caches (Cloudflare, Vercel Edge) for `/api/stream/proxy` and `/index.html`.
