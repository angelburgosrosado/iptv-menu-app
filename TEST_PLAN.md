# IPTV.MENU — Comprehensive Quality Assurance & Test Plan

This document establishes a test matrix covering all core user flows, edge cases, TV navigation behaviors, security gates, and automated test commands.

---

## 1. Automated Test Execution Commands

### 1.1 Run All Unit & Integration Tests
```bash
# Execute entire test suite
npm test

# Run tests in watch mode during development
npm run test:watch
```

### 1.2 TypeScript Compilation & Static Analysis
```bash
# Workspace root & web type-check
npm run lint

# Mobile React Native type-check
cd mobile && npx tsc --noEmit && cd ..
```

### 1.3 Full Monorepo Build Verification
```bash
# 1. Compile workspace packages
npm run build:packages

# 2. Compile API & Worker workspaces
npm run build:api && npm run build:worker

# 3. Bundle Serverless CJS API
npm run build:api:bundle

# 4. Compile Vite Production Web Bundle
npx vite build
```

---

## 2. Core Functional Test Matrix

| ID | User Flow / Subsystem | Test Description | Input / Trigger | Expected Outcome | Test Type |
|---|---|---|---|---|---|
| **AUTH-01** | User Registration | Register new account with email & password | Valid email, password (>= 6 chars) | Account created, password hashed with bcrypt, signed JWT returned | Integration / API |
| **AUTH-02** | User Login | Authenticate existing user | Registered email + correct password | Valid signed JWT returned, session persisted to localStorage | Integration / API |
| **AUTH-03** | Invalid Password Login | Attempt login with incorrect password | Registered email + wrong password | HTTP 401 Unauthorized with descriptive error | Integration / API |
| **AUTH-04** | Role Escalation Tampering | Client sends forged Base64 / altered JWT with `role: "admin"` | Modified Authorization header | HTTP 401/403 Rejected, cryptographic signature verification fails | Security / API |
| **AUTH-05** | Admin Guard Gate | Non-admin user attempts access to `/api/admin/*` | Valid user token with `role: "user"` | HTTP 403 Forbidden with role restriction notice | Security / API |
| **M3U-01** | Standard Playlist Parse | Parse clean M3U8 with `#EXTINF` metadata | Standard M3U file with tvg-id, logo, group | Array of Channel objects with correct IDs and attributes | Unit (`tests/m3uParser.test.ts`) |
| **M3U-02** | Non-Standard Line Breaks | Parse playlist with mixed `\r\n` and `\n` | Windows & Unix formatted M3U text | All channels extracted without line fragment artifacts | Unit (`tests/m3uParser.test.ts`) |
| **M3U-03** | Duplicate Stream Filtering | Parse playlist with repeated stream URLs | M3U containing 5 identical channel URLs | Deduplicated to 1 channel instance | Unit (`tests/m3uParser.test.ts`) |
| **M3U-04** | Large Playlist Stress Test | Ingest 50,000 channel commercial playlist | 25MB M3U file | Parsed asynchronously without freezing UI thread; memory stays <150MB | E2E / Performance |
| **M3U-05** | Malformed File Rejection | Ingest binary file or non-M3U text | File without `#EXTM3U` header | Graceful error notification; parser returns empty array without crash | Unit (`tests/m3uParser.test.ts`) |
| **PLAY-01** | HLS Video Playback | Load standard HLS stream (.m3u8) | Public HLS URL (e.g. NASA TV) | Video initializes, buffers, and begins playback within 3s | E2E / Web & Mobile |
| **PLAY-02** | CORS Proxy Fallback | Load stream with strict upstream CORS headers | Cross-origin stream URL | VideoView detects network error and routes through `/api/stream/proxy` | Integration (`tests/streamProxy.test.ts`) |
| **PLAY-03** | HTTPS Mixed Content Relay | Load HTTP stream on HTTPS deployment | `http://...` stream URL | Auto-wrapped with `/api/stream/proxy?url=...` to avoid browser block | Integration / Web |
| **PLAY-04** | Stream Failure & Retry | Upstream video stream returns HTTP 500/404 | Dead stream URL | Player displays offline banner and retry button; triggers fallback stream | Unit (`tests/streamDiagnostics.test.ts`) |
| **PLAY-05** | Channel Switching Cleanup | Switch channels rapidly 5 times | Click channel 1 -> 2 -> 3 -> 4 -> 5 | Previous Hls instance destroyed; no duplicate audio tracks playing | Manual / Web & Mobile |
| **PLAY-06** | Audio DSP Equalizer | Adjust 5-band EQ and bass boost | Slider adjustments in Equalizer modal | Web Audio BiquadFilter nodes update frequencies without audio popping | Unit (`tests/audioDsp.test.ts`) |
| **NAV-01** | TV D-Pad Spatial Navigation | Navigate channel cards with Arrow keys | ArrowRight, ArrowDown, ArrowUp, ArrowLeft | Visual focus halo shifts smoothly to closest 2D element in direction | Unit (`tests/spatialNavigation.test.ts`) |
| **NAV-02** | D-Pad Selection | Press Enter on focused channel card | Enter / OK key on remote | Selected channel opens in full video player | Manual / Smart TV |
| **NAV-03** | Form Input Defocusing | Press Arrow keys while typing in Search bar | Keyboard typing in search input | Navigation keys do not hijack cursor; Escape key defocuses input | Unit (`tests/spatialNavigation.test.ts`) |
| **EPG-01** | Live Now/Next Retrieval | Query current schedule for channel list | `/api/epg/live?channelIds=ca.tsn1,us.cnn` | Returns matching current and upcoming broadcast items | Integration (`tests/backendEpgAndMetadata.test.ts`) |
| **EPG-02** | XMLTV Entity Decoding | Ingest XMLTV with XML entities (`&amp;`, `&quot;`) | `<title>Law &amp; Order</title>` | Title rendered cleanly as `"Law & Order"` | Unit / API |
| **EPG-03** | Multi-Source EPG Merging | Background worker aggregates 2 EPG XML feeds | Feed A + Feed B | Single valid XMLTV output with one `<tv>` root container | Integration (`apps/worker`) |
| **PIP-01** | Floating PiP Mini Player | Minimize active video player to PiP window | Click PiP button or navigate to Settings | Floating resizable player appears in bottom-right corner; video continues | Unit (`tests/floatingPipPlayer.test.ts`) |
| **MULTI-01**| 2x2 Multi-Screen Matrix | Add 4 simultaneous live streams | 4 channels in MultiScreen view | 4 video windows render simultaneously; audio focuses on clicked cell | Unit (`tests/multiScreenMatrix.test.ts`) |
| **WORK-01** | Worker Task Locking | Multiple workers poll for queued jobs | 1 queued job in `playlist_runs` | Exactly one worker locks and processes task; no double execution | Integration / Concurrency |
| **WORK-02** | Stream Probe & Dead Link Prune | Worker validates playlist with dead links | Playlist with 3 alive and 2 dead streams | Output playlist preserves only 3 alive streams; run summary records stats | Integration (`apps/worker`) |
| **QUOTA-01**| Multi-Tenant Workspace Limits | Free user attempts uploading 2nd playlist | Workspace with `maxPlaylists: 1` | HTTP 403 Quota exceeded error; prompts for Pro subscription | Unit (`tests/workspaceQuota.test.ts`) |
| **BILL-01** | Stripe Checkout Session | User selects Pro subscription plan | POST `/api/billing/create-checkout-session` | Stripe checkout redirect URL returned with session metadata | Integration / API |
| **BILL-02** | Stripe Webhook Processing | Stripe fires `checkout.session.completed` | Valid signed webhook payload | User `subscriptionTier` upgraded to `pro`; workspace quotas updated | Integration / API |
| **SEC-01**  | SSRF Loopback Attack | Attacker calls `/api/stream/proxy?url=http://127.0.0.1:3000` | Loopback IP target | HTTP 400/403 Rejected; loopback access blocked | Security (`tests/streamProxy.test.ts`) |
| **SEC-02**  | SSRF Cloud Metadata Attack | Attacker calls `/api/stream/proxy?url=http://169.254.169.254` | AWS/GCP metadata IP target | HTTP 400/403 Rejected; metadata access blocked | Security (`tests/streamProxy.test.ts`) |
| **SEC-03**  | SSRF DNS Rebinding Defense | Attacker calls proxy with domain resolving to private IP | Domain resolving to `10.0.0.1` | DNS resolution checks fail; connection aborted before request sent | Security / API |
| **MOB-01**  | Mobile Background Playback | User exits app while stream is playing | Home button on Android | Audio playback continues; foreground media notification displayed | Manual / Mobile Device |
| **MOB-02**  | Screen Unmount Audio Cleanup | User presses Back button on player screen | Back navigation to channel list | Player pauses and unmounts; audio ceases immediately | Manual / Mobile Device |

---

## 3. Manual Testing & Verification Runbook

### 3.1 Smart TV / Remote Navigation Verification
1. Launch the web app in a browser: `npm run dev`.
2. Connect a gamepad or use keyboard Arrow keys:
   - Verify `ArrowDown` highlights the first channel card.
   - Verify `Enter` plays the highlighted channel.
   - Verify active focus indicator has high-contrast visibility (`#3b82f6` halo border).
   - Verify scrolling is smooth and elements do not jump unexpectedly.

### 3.2 Mobile APK Build Verification
1. Verify mobile project builds without errors: `cd mobile && npx tsc --noEmit`.
2. Trigger non-blocking preview build: `npm run build:apk`.
3. Test generated APK on an Android test device or emulator running Android 11+.
