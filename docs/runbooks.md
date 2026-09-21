# IPTV.MENU Operational Runbooks

This guide outlines step-by-step procedures for handling critical system operations, debugging, and service administration across **Neon PostgreSQL** and fallback stores.

---

## Runbook 1: Promoted/First-Time Admin Setup

To designate a platform user with Administrator roles:

### Method A: Via Neon PostgreSQL (Primary)
Connect to Neon using `npm run db:studio` or execute via SQL:
```sql
-- Promote user in Neon
UPDATE users
SET role = 'admin', updated_at = NOW()
WHERE uid = '<TARGET_UID>' OR email = 'user@example.com';

-- Log administrative audit record
INSERT INTO admin_actions (action_id, admin_uid, action_type, target_type, target_id, notes, timestamp)
VALUES (
  'act_' || substr(md5(random()::text), 1, 12),
  'system',
  'user_promote',
  'user',
  '<TARGET_UID>',
  'Promoted to admin via runbook',
  NOW()
);
```

### Method B: Via REST API
```bash
curl -X PATCH https://iptv.menu/api/admin/users/<TARGET_UID>/role \
  -H "Authorization: Bearer <ADMIN_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### Method C: Legacy Firestore Fallback
Open the Cloud Firestore Console, navigate to `users/{TARGET_UID}`, and update the `"role"` field value to `"admin"`.

---

## Runbook 2: Account Suspension & Instant Session Revocation

When a user violates platform guidelines, suspend their account and drop active access sessions instantly.

### Steps:
1. **Update status in Neon Database**:
   ```sql
   UPDATE users
   SET account_status = 'suspended', updated_at = NOW()
   WHERE uid = '<TARGET_UID>';
   ```
2. **Revoke Auth Tokens via REST API**:
   ```bash
   curl -X PATCH https://iptv.menu/api/admin/users/<TARGET_UID>/status \
     -H "Authorization: Bearer <ADMIN_ID_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"status": "suspended"}'
   ```
   The administrative endpoint automatically calls `admin.auth().revokeRefreshTokens(userId)` and updates custom claims.

---

## Runbook 3: Inspecting & Adjusting Build Quotas

To verify or manually increment a customer's private APK build quota:

```sql
-- View current usage and entitlements
SELECT workspace_id, name, plan, entitlements, usage
FROM workspaces
WHERE owner_uid = '<TARGET_UID>';

-- Grant 10 bonus builds for the current month
UPDATE workspaces
SET usage = jsonb_set(usage, '{monthlyBuildsUsed}', '0'::jsonb),
    updated_at = NOW()
WHERE owner_uid = '<TARGET_UID>';
```

---

## Runbook 4: Debugging Worker Job Queue

If background tasks (playlist cleaning, EPG generation, or APK builds) appear stuck:

1. **Check Queued or Failed Jobs**:
   ```sql
   -- Check pending build jobs
   SELECT build_id, app_name, status, created_at, updated_at
   FROM build_requests
   WHERE status IN ('queued', 'building', 'failed')
   ORDER BY created_at DESC
   LIMIT 10;

   -- Check playlist runs
   SELECT run_id, playlist_id, type, status, started_at, error
   FROM playlist_runs
   WHERE status IN ('queued', 'running', 'failed')
   ORDER BY started_at DESC
   LIMIT 10;
   ```
2. **Reset a Stalled Job**:
   ```sql
   UPDATE build_requests
   SET status = 'queued', updated_at = NOW()
   WHERE build_id = '<STALLED_BUILD_ID>';
   ```
