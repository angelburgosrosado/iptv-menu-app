# IPTV Menu Pro - Production Finalization Plan

## Confirmed Features & Production Requirements Architecture

### 1. Project File & Folder Structure
```
iptv-menu-app/
├── apps/
│   ├── api/                      # Express REST API (Stripe webhooks, OTA endpoints, build triggers)
│   │   └── src/
│   │       ├── server.ts
│   │       ├── services/
│   │       └── middleware/
│   └── worker/                   # Background job worker (stream probe, M3U cleaner)
│       └── src/
├── packages/                     # Monorepo shared packages
│   ├── auth/                     # JWT & token verification
│   ├── billing/                  # Stripe billing client & webhooks
│   ├── config/                   # Shared env configurations
│   ├── db/                       # Drizzle ORM schema & repositories
│   ├── jobs/                     # Job definitions
│   ├── logging/                  # Centralized structured logger
│   ├── storage/                  # Cloud Storage signed URLs
│   ├── types/                    # Shared TypeScript interfaces
│   └── ui/                       # Shared UI tokens
├── src/                          # Main React Web Application
│   ├── App.tsx                   # Main layout, sidebar navigation, phone simulator frame
│   ├── index.css                 # Dark-first design system, cyan accents, animations
│   ├── authStore.ts              # Client auth state management
│   ├── lib/
│   │   ├── apiClient.ts          # Authenticated fetch wrapper
│   │   ├── supabase.ts           # Supabase client initialization
│   │   └── firebase.ts           # Firebase SDK utilities
│   ├── hooks/
│   │   └── useSupabaseAuth.ts    # Supabase auth hook with OAuth & Email/Password
│   ├── store/
│   │   ├── usePlayerStore.ts     # Zustand store for streams, playlists, favorites, history
│   │   └── useWorkspaceStore.ts  # Workspace & entitlement state
│   ├── components/
│   │   ├── PageProtocolHeader.tsx# Standardized page title & protocol breadcrumbs
│   │   ├── ChannelCard.tsx       # Live/dead indicators, now/next badges, swipe actions
│   │   ├── DesktopChannels.tsx   # [FEATURE 2] Live Channel Browser & virtualized list
│   │   ├── VideoPlayer.tsx       # [FEATURE 3] HLS Stream Player simulator
│   │   ├── WebCinemaPlayer.tsx   # [FEATURE 3] Web Cinema full-screen player
│   │   ├── MultiScreenMatrix.tsx # [FEATURE 4] Quad Multi-Screen View (2x2 grid)
│   │   ├── DesktopEpg.tsx        # [FEATURE 5] XMLTV Electronic Program Guide time-grid
│   │   ├── DesktopFavorites.tsx  # [FEATURE 6] Favorites & Recently Watched History ledger
│   │   ├── XtreamConnector.tsx   # [FEATURE 7] Xtream Codes & Stalker Portal connector
│   │   ├── DesktopApkBuilder.tsx # [FEATURE 8] Dedicated APK App Builder Suite
│   │   ├── DesktopRemoteApps.tsx # [FEATURE 9] Remote OTA App Engine & version rollback
│   │   ├── DesktopPremium.tsx    # [FEATURE 10] Subscription & Billing (Stripe checkout)
│   │   ├── PricingSection.tsx    # [FEATURE 10] 3-tier matrix with yearly 20% discount
│   │   ├── AuthModal.tsx         # [FEATURE 11] Auth dialog (Supabase / Google OAuth / Email)
│   │   ├── UserProfileModal.tsx  # [FEATURE 11] User Profile, plan tier, APK builds counter
│   │   ├── admin/
│   │   │   └── SystemAdminConsole.tsx # [FEATURE 12] Platform Admin Panel
│   │   ├── CertifiedDevices.tsx  # [FEATURE 13] Certified Devices Registry & setup guides
│   │   ├── DesktopSettings.tsx   # [FEATURE 14] Buffer size, theme toggle, default URL, delete account
│   │   ├── DesktopM3uUpload.tsx  # [FEATURE 1] M3U Playlist Manager, Auto-cleaner, Export
│   │   ├── OnboardingModal.tsx   # 3-step first-time onboarding modal
│   │   ├── LegalModal.tsx        # Privacy Policy, Terms of Service, DMCA modal
│   │   ├── ProtectedRoute.tsx    # Protected route & tier entitlement wrapper
│   │   └── RateLimitBanner.tsx   # Rate limiting quota alert feedback banner
│   ├── types/
│   │   └── iptv.ts               # Channel, playlist, EPG, and stream types
│   └── utils/
│       ├── m3uParser.ts          # RFC 8216 M3U/M3U8 parser
│       ├── channelEnrichment.ts  # Regional metadata & country matching
│       └── xtreamClient.ts       # Xtream Codes API client
```

---

## Execution Modules

### Module 1: Design System & Styling
- Apply dark-first color tokens in `src/index.css`:
  - Background: `#0e0e10`, Surface: `#16161a`, Surface-2: `#1c1c21`
  - Primary accent: `#00d4ff` (electric cyan)
  - Text: `#e8e8f0`, Muted: `#8888a0`
  - Fonts: Inter (body) & Space Grotesk (headings)
  - Rounded borders & cyan glow styles

### Module 2: Authentication & User Accounts (Supabase + OAuth)
- Scaffold `src/lib/supabase.ts` and `src/hooks/useSupabaseAuth.ts`
- Provide `ProtectedRoute.tsx` wrapper for Pro/Builder views
- Provide `UserProfileModal.tsx` showing email, plan tier, billing date, and APK builds used (3 of 10)

### Module 3: M3U Playlist Manager (Feature 1)
- In `src/components/DesktopM3uUpload.tsx`:
  - Upload & parse M3U/M3U8 files and URLs
  - Auto-clean dead/broken stream links (20 daily automated runs on Pro tier with quota tracker)
  - Export and download cleaned `.m3u` file locally
  - Manage active playlists (up to 10 active playlists and 5 hosted remote URLs on Pro)

### Module 4: Live Channel Browser & Stream Player (Features 2 & 3)
- In `src/components/DesktopChannels.tsx` & `ChannelCard.tsx`:
  - Full-text search across channel name, sport, or network
  - Filter by group category (Animation, Sports, News, Movies, Kids, etc.)
  - Channel count and live/dead status indicators
  - Skeleton loaders for channels during loading
  - Clean empty state when no channels match query

### Module 5: Quad Multi-Screen View & EPG (Features 4 & 5)
- In `src/components/MultiScreenMatrix.tsx`:
  - 4 simultaneous HLS streams in 2x2 grid
  - Independent channel selection per quadrant
  - Volume slider and mute control per stream
- In `src/components/DesktopEpg.tsx`:
  - XMLTV auto-feed integration
  - Time-grid EPG schedule
  - Now/Next program preview cards with progress indicator

### Module 6: Favorites & History (Feature 6)
- In `src/components/DesktopFavorites.tsx`:
  - Tab toggle: "Favorites" vs "Recently Watched History"
  - Favorite channels toggle (stored per session in MMKV / storage)
  - Recently watched history with timestamps
  - "Clear History" action with confirmation modal
  - Empty states for both tabs

### Module 7: Xtream & Stalker Protocol Support (Feature 7)
- In `src/components/XtreamConnector.tsx`:
  - Input fields for Xtream Codes API credentials (URL, username, password)
  - Stalker portal URL and MAC address entry
  - Auto-load and parse channels from both sources

### Module 8: APK App Builder Suite (Feature 8)
- In `src/components/DesktopApkBuilder.tsx`:
  - Dedicated screen in navigation
  - 10 APK builds per month quota tracker
  - Custom branding: app name, package ID, logo URL, brand colors
  - EAS Build API simulation & live build logs
  - Direct APK download link and install QR code generator

### Module 9: Remote OTA App Engine (Feature 9)
- In `src/components/DesktopRemoteApps.tsx`:
  - Dynamic remote configuration pushed to deployed APKs without reinstall
  - Playlist URL and branding updates via OTA
  - Version history and instant rollback

### Module 10: Subscription & Billing (Feature 10)
- In `src/components/DesktopPremium.tsx` & `src/components/PricingSection.tsx`:
  - Free, Pro Streamer ($9.99/mo), and App Builder Suite ($29.99/mo)
  - Monthly and yearly billing toggle (20% discount on yearly)
  - Stripe Checkout session creation + Stripe Customer Portal integration
  - Upgrade/downgrade confirmation modal

### Module 11: Platform Admin Panel & Certified Devices (Features 12 & 13)
- In `src/components/admin/SystemAdminConsole.tsx`:
  - User management (view accounts, plan status, suspend)
  - Stream health overview (global dead-link stats)
  - APK build queue and logs
  - Revenue & subscription metrics
- In `src/components/CertifiedDevices.tsx`:
  - Curated registry of IPTV-compatible Android/Fire TV devices
  - Compatibility badges and setup guide links

### Module 12: Settings (Feature 14)
- In `src/components/DesktopSettings.tsx`:
  - Buffer size / latency preferences (1.5s, 3.0s, 6.0s)
  - Theme toggle (Dark / Light)
  - Default playlist URL
  - Cache clear action
  - Account deletion with dangerous action confirmation modal

### Module 13: Production Polish & Legal Requirements
- In `src/components/OnboardingModal.tsx`:
  - 3-step onboarding flow: (1) Choose tier, (2) Upload playlist, (3) Preview channel
- In `src/components/LegalModal.tsx`:
  - Privacy Policy, Terms of Service, and DMCA pages
- Rate limiting UI feedback banner when quota is reached
- Fix all TypeScript compilation errors (`npm run lint` and `npm run build:web`).
