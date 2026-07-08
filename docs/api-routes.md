# IPTV.MENU REST API Route Manifest

The REST API (`apps/api`) serves public, authenticated, and administrative endpoints.

## 1. Public Endpoints
All public endpoints can be accessed without a Firebase Authorization header.

- **`GET /api/health`**
  - Returns current API service health, env context, and server state.
- **`GET /api/public/pricing`**
  - Exposes active Stripe billing tiers, subscription plans, and features.
- **`GET /api/public/devices`**
  - Returns certified IPTV hardware (Nvidia Shield, Firestick, Apple TV, etc.).
- **`POST /api/public/contact`**
  - Processes public inquiry and support email forms.

---

## 2. Authenticated Endpoints
Requires header: `Authorization: Bearer <Firebase_ID_Token>`.

### Profile Operations
- **`GET /api/me`**
  - Resolves profile. Auto-creates a new record in Firestore if none is present.
- **`PATCH /api/me/profile`**
  - Updates profile metadata (displayName, photoURL).
- **`GET /api/me/subscription`**
  - Resolves the caller's payment status, active subscription plan, and limits.

### Playlist Operations
- **`POST /api/playlists`**
  - Registers a new playlist slot. Generates a secure Cloud Storage Signed URL for direct client file upload.
- **`GET /api/playlists`**
  - Resolves all playlists owned by the caller.
- **`GET /api/playlists/:playlistId`**
  - Resolves a single playlist's details.
- **`DELETE /api/playlists/:playlistId`**
  - Removes a playlist from Firestore and deletes original/cleaned assets from GCS buckets.

### Job Dispatches (Async Processing)
- **`POST /api/playlists/:playlistId/parse`**
  - Triggers asynchronous worker parse job.
- **`POST /api/playlists/:playlistId/clean`**
  - Enqueues background stream deduplication task.
- **`POST /api/playlists/:playlistId/validate`**
  - Dispatches async stream health validation/ping sweeps.
- **`GET /api/playlists/:playlistId/runs`**
  - Returns historic execution stats, channels checked, and logs for a playlist.

### EPG Operations
- **`POST /api/epg`**
  - Schedules background XMLTV XML generation for specified streams.
- **`GET /api/epg`**
  - Lists Scheduled EPG tasks.
- **`GET /api/epg/:epgId`**
  - Returns details on a single EPG task.

### App Builds
- **`POST /api/builds`**
  - Queues an Expo compilator request for generating personalized Android IPTV APK launch containers.
- **`GET /api/builds`**
  - Lists the caller's compilation requests.
- **`GET /api/builds/:buildId`**
  - Returns build progress and GCS download URLs for successful APK outputs.

### Billing
- **`POST /api/billing/create-checkout-session`**
  - Creates a secure Stripe Checkout Redirect URL for Premium subscriptions.
- **`POST /api/billing/create-portal-session`**
  - Returns a Stripe Customer Billing Portal session URL to update credit cards or cancel plans.

---

## 3. Webhooks & Private Integrations
- **`POST /api/webhooks/stripe`**
  - Secure webhook signature validator upgrading/downgrading profiles on Stripe payment success or subscription default.
- **`POST /api/internal/jobs/playlist-clean`**
  - Secure internal cron trigger to prompt queue cleanup sweeps.

---

## 4. Administrative Operations
Protected by both `authenticateFirebaseToken` and `authorizeRoles(['admin'])` gates.

- **`GET /api/admin/users`**
  - Lists registered platform users with limit parameters.
- **`GET /api/admin/users/:userId`**
  - Returns administrative diagnostics for a user profile.
- **`PATCH /api/admin/users/:userId/role`**
  - Grants administrative, builder, pro, or regular role, updating custom JWT claims in Firebase Auth instantly.
- **`PATCH /api/admin/users/:userId/status`**
  - Sets account status (`active` | `suspended`). Instantly revokes existing active sessions.
- **`GET /api/admin/playlists`**
  - Inspects active database playlists.
- **`GET /api/admin/audit-logs`**
  - Fetches platform audit trails of administrative updates.
