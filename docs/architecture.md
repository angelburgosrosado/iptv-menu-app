# IPTV.MENU System Architecture Blueprint

This document details the architectural boundaries, system integrations, and component flows of the **iptv.menu** production-ready monorepo.

## System Topology

The system operates a high-performance decoupling topology designed for high-availability playlist processing:

```
                    +--------------------+
                    |  Client Web / App  |
                    +---------+----------+
                              | (HTTPS / Firebase Auth ID Token)
                              v
                     +--------+---------+
                     |  iptv-api        | <---+ GCS Signed Urls
                     |  (Cloud Run API) |
                     +--------+---------+
                              |
                     (Writes queued runs)
                              |
                              v
                     +--------+---------+
                     |  Cloud Firestore |
                     +--------+---------+
                              ^
                     (Worker polling/lock)
                              |
                     +--------+---------+
                     |  iptv-worker     |
                     |  (Cloud Run Async| <---+ Downloads M3U
                     |   Task Service)  | ====> Uploads cleaned M3U / XMLTV / APKs
                     +--------+---------+
```

## Key Modules

### 1. Public Marketing Site & App Shell (`apps/web/`)
A Next.js/Vite application presenting public information, a device-matching portal, stripe checkouts, and an IPTV Mobile Simulator showcasing optimized, client-side virtualized rendering.

### 2. High-Performance REST API Service (`apps/api/`)
Fully authenticated Express gateway verifying Firebase JWT ID tokens. Routes include user profiles, playlist ingestion management, signed download/upload URL generation, Stripe payments creation, and secure admin interfaces.

### 3. Background Async Processors (`apps/worker/`)
Isolated service listening for long-running task events in Firestore. Handlers execute chunked stream validation, duplicate cleansing, EPG TV listings fetching, and custom APK builder compiling, keeping API response latency under 50ms.

### 4. Shared TS Packages (`packages/`)
- `@iptv-menu/types`: Domain types & state schemas.
- `@iptv-menu/auth`: Firebase Admin authentication and Role-Based Access Control (RBAC).
- `@iptv-menu/db`: Clean, typesafe Firestore repositories with customized permissions error tracking.
- `@iptv-menu/storage`: Google Cloud Storage bucket loaders and signed URL generators.
- `@iptv-menu/billing`: Stripe customer management, subscription sessions, and webhook signature validators.
- `@iptv-menu/logging`: Structured JSON logging schema tailored for automatic Google Cloud Logging.
