# Private Feed Unrestricted Playback Suite: Firestick & Desktop Guide

This document outlines the solutions implemented to allow customers to play their private IPTV feeds without the restrictions imposed by standard web browsers (such as CORS, mixed-content blocking, lack of MPEG-TS container decoding, and audio codec incompatibilities).

---

## 1. Executive Summary

| Platform | Client Type | Engine | MPEG-TS Support | CORS / Mixed Content | How to Run / Build |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Amazon Firestick & Android TV** | Native Android APK | Google Media3 / ExoPlayer | **Native Hardware Decoding** | Completely Bypassed | `npm run build:apk` |
| **Desktop (macOS / Windows / Linux)** | Desktop App (Electron) | Chromium + Custom Network Interceptor | **Vendored mpegts.js & HLS** | Completely Bypassed | `npm run desktop` |
| **Web Browser (Chrome / Safari / Firefox)** | Web App (Vite React) | Bundled MSE + Bi-Directional Converter | **In-Memory Transmuxer** | Handled via Proxy / SSL | `npm run dev` / Production URL |

---

## 2. Amazon Firestick & Android TV (Priority #1)

### Architecture
* Built using the native [`mobile`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile) workspace (`React Native` + `expo-video`).
* Compiles to Google **Media3 / ExoPlayer**, which features **native MPEG-TS (`.ts`) demuxers** directly in the Android OS.
* Has `usesCleartextTraffic: true` enabled in [`mobile/app.json`](file:///Volumes/MacAI/ABGlobalCEO/iptv-menu-app/mobile/app.json) so unencrypted `http://` private streams are never blocked.
* Supports Dolby AC-3 / E-AC3 hardware passthrough via TV HDMI arc.

### Building the Firestick APK
To build a standalone APK for Firestick distribution:
```bash
# 1. Ensure EAS CLI is available and run the build:
npm run build:apk

# Or directly in mobile workspace:
cd mobile
eas build --platform android --profile preview --non-interactive
```
*The build output produces a downloadable `.apk` file hosted directly on Expo servers or your custom storage bucket.*

### Customer Sideloading Instructions for Firestick
1. **Enable Developer Options on Firestick**:
   * Navigate to **Settings** > **My Fire TV** > **About**.
   * Click the device name 7 times until *"You are now a developer"* appears.
   * Go back to **Developer Options** > Turn on **Install Unknown Apps** / **ADB Debugging**.
2. **Install via the "Downloader" App**:
   * Open the Amazon Appstore, search for and install **Downloader**.
   * Open Downloader, enter the direct URL to your compiled APK (or shortcode URL).
   * Click **Go**, download the APK, and select **Install**.
3. **Launch**:
   * The app appears in the Fire TV grid under "Your Apps & Channels". Customers can input their M3U URL or Xtream Codes credentials directly.

---

## 3. Desktop Application Suite (Priority #2)

### Architecture
* Built using **Electron** in the root workspace (`electron/main.cjs` and `electron/preload.cjs`).
* Wraps the React application in an unrestricted desktop window.
* **Bypasses CORS**: Disables standard browser Same-Origin Policy (`webSecurity: false`).
* **Bypasses Mixed Content**: Allows insecure HTTP streams on HTTPS UI without browser blocking (`allowRunningInsecureContent: true`).
* **Header Spoofing**: Injects `User-Agent: VLC/3.0.18 LibVLC/3.0.18` on all outgoing playlist, TS, and HLS requests.
* **MPEG-TS Engine**: Runs the local in-memory demuxer with background throttling disabled so streaming continues even when minimized.

### Running the Desktop App
```bash
# In development (with Vite server running):
npm run desktop:dev

# In production mode:
npm run desktop
```

---

## 4. Web In-Memory Demuxing & Auto-Recovery Enhancements

For customers who continue using the web application in a browser:
1. **Locally Vendored Demuxers**:
   * `mpegts.js` (v1.8.2) and `hls.js` are now installed in `package.json` and mirrored in `public/vendor/mpegts.min.js` and `public/vendor/hls.min.js`.
   * Dynamic loading in `src/shims/expo-video.tsx` prioritizes bundled imports and local vendor files first before falling back to CDNs.
2. **Bi-Directional Xtream Auto-Recovery**:
   * In `src/components/VideoPlayer.tsx`, if a raw `.ts` feed fails in the browser, the player automatically derives and tests the `.m3u8` variant.
   * If an `.m3u8` feed fails, it automatically tests the `.ts` variant with the `mpegts` demuxer.
   * Eliminates the need for manual customer intervention.
