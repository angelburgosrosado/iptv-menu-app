# IPTV.MENU Operational Runbooks

This guide outlines step-by-step procedures for handling critical system operations, debugging, and service administration.

---

## Runbook 1: Promoted/First-Time Admin Setup
To designate a platform user with Administrator roles:

### Steps:
1. Obtain the User's UID from the Firebase Auth console or by resolving `GET /api/me`.
2. Access the REST API under an existing admin identity, or execute the following administrative endpoint override:
   ```bash
   curl -X PATCH https://api.iptv.menu/api/admin/users/<TARGET_UID>/role \
     -H "Authorization: Bearer <ADMIN_ID_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"role": "admin"}'
   ```
3. Alternatively, open the Cloud Firestore Console, navigate to `users/{TARGET_UID}`, and update the `"role"` field value to `"admin"`.
4. Create an entry in `/admins/{TARGET_UID}` to seal the security rules lookup gate.

---

## Runbook 2: Account Suspension & Instant Session Revocation
When a user violates platform guidelines, suspend their account and drop active access sessions instantly.

### Steps:
1. Update the account status field inside Firestore to block database read/writes:
   ```bash
   curl -X PATCH https://api.iptv.menu/api/admin/users/<TARGET_UID>/status \
     -H "Authorization: Bearer <ADMIN_ID_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"status": "suspended"}'
   ```
2. The administrative endpoint will automatically invoke:
   - `admin.auth().revokeRefreshTokens(userId)` to invalidate active authorization tokens.
   - `admin.auth().setCustomUserClaims(userId, { accountStatus: 'suspended' })` to flag the JWT payload instantly.

---

## Runbook 3: Debugging Permission Denied Logs
If Firestore rules block client actions, locate the exact mismatch parameters using the structured JSON logs.

### Steps:
1. Navigate to Google Cloud Run Logs for the `iptv-api` service.
2. Filter for logs containing `"operationType"` and `"path"`.
3. Locate the `FirestoreErrorInfo` trace:
   ```json
   {
     "severity": "ERROR",
     "message": "[db-repository] Firestore Error during update on users",
     "operationType": "update",
     "path": "users/user_abc123",
     "error": "Missing or insufficient permissions"
   }
   ```
4. Map the path (`users/user_abc123`) and operation (`update`) to `firestore.rules`.
5. Check if the user is verified, if they are attempting to modify immutable fields (e.g., `role`, `subscriptionTier`), or if the `isValidUserProfile` schema check failed.
