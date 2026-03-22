---
"@falcon-framework/sdk": minor
---

Add a **Falcon Connect HTTP client** on `@falcon-framework/sdk/connect`: **`createFalconConnectClient`** wraps all Connect API v1 endpoints with **fetch**, optional **`X-Falcon-App-Id`** / **`X-Organization-Id`** (via existing `buildFalconConnectHeaders`), optional **Bearer** tokens, and **Zod** validation of every success response and mutation body.

**New runtime dependency:** `zod` (declared on the SDK package).

**Errors:** `FalconConnectHttpError`, `FalconConnectValidationError`, `FalconConnectParseError`, and `FalconConnectNetworkError` for structured handling.

**Behavior change:** successful HTTP responses are now **parsed with Zod**. Previously, apps using ad-hoc clients relied on unchecked `as` casts; if the server returned an unexpected shape, you now get `FalconConnectValidationError` instead of silent type lies.

**Docs:** user-guide page `docs/user-guide/sdk/falcon-connect-client.md` (recipes for source, target, and management flows).

Display helpers (`resolveFalconConnectionsDisplay`, etc.) are unchanged and compose with the new client.
