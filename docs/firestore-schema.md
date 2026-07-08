# IPTV.MENU Firestore Data Schema

This document details the collections, document shapes, and indexes defined inside Cloud Firestore.

## Collections & Documents

### 1. `users/{uid}`
Tracks platform user metadata, roles, and status levels.

```json
{
  "uid": "string (Matches Firebase Auth UID)",
  "email": "string",
  "displayName": "string | null",
  "photoURL": "string | null",
  "role": "string ('user' | 'pro' | 'builder' | 'admin')",
  "subscriptionTier": "string ('free' | 'pro' | 'builder')",
  "accountStatus": "string ('active' | 'suspended')",
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string"
}
```

### 2. `playlists/{playlistId}`
Stores records of uploaded M3U links, channel counters, and file associations.

```json
{
  "playlistId": "string",
  "uid": "string",
  "name": "string",
  "sourceType": "string ('url' | 'upload')",
  "originalFilePath": "string (GCS gs://... Path) | null",
  "cleanedFilePath": "string (GCS gs://... Path) | null",
  "channelCount": "number",
  "status": "string ('pending' | 'parsing' | 'cleaning' | 'validating' | 'ready' | 'failed')",
  "visibility": "string ('private' | 'public')",
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string"
}
```

#### Subcollection: `playlists/{playlistId}/runs/{runId}`
Tracks individual background processing attempts and diagnostic diagnostics.

```json
{
  "runId": "string",
  "playlistId": "string",
  "type": "string ('parse' | 'clean' | 'validate')",
  "status": "string ('queued' | 'running' | 'completed' | 'failed')",
  "startedAt": "ISO-8601 string",
  "completedAt": "ISO-8601 string | null",
  "summary": {
    "channelsProcessed": "number | null",
    "channelsRemoved": "number | null",
    "deadStreamsDetected": "number | null"
  },
  "error": "string | null"
}
```

### 3. `epgFeeds/{epgId}`
Tracks scheduling parameters for generating XMLTV XML guide feeds.

```json
{
  "epgId": "string",
  "uid": "string",
  "playlistId": "string",
  "status": "string ('pending' | 'generating' | 'ready' | 'failed')",
  "sourceConfig": {
    "urls": ["string"],
    "refreshIntervalHours": "number"
  },
  "outputFilePath": "string (GCS gs://... XMLTV path) | null",
  "lastGeneratedAt": "ISO-8601 string | null",
  "createdAt": "ISO-8601 string"
}
```

### 4. `buildRequests/{buildId}`
Details for compiling customized IPTV launch packages.

```json
{
  "buildId": "string",
  "uid": "string",
  "appName": "string",
  "brandConfig": {
    "primaryColor": "string",
    "logoUrl": "string | null",
    "accentColor": "string"
  },
  "playlistSource": {
    "type": "string ('playlistId' | 'url')",
    "value": "string"
  },
  "status": "string ('queued' | 'building' | 'succeeded' | 'failed')",
  "artifactPath": "string | null",
  "buildLogPath": "string | null",
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string"
}
```

### 5. `adminActions/{actionId}`
Platform audit trail for admin console actions.

```json
{
  "actionId": "string",
  "adminUid": "string",
  "actionType": "string (e.g., 'ROLE_UPDATE')",
  "targetType": "string ('user' | 'playlist' | 'build')",
  "targetId": "string",
  "notes": "string",
  "createdAt": "ISO-8601 string"
}
```
"
