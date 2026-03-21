---
"@falcon-framework/sdk": minor
---

Add `completeAuthCallback` to the main SDK entry. It validates the OAuth `code` and optional `state`, runs the code exchange (typically `exchangeCodeForSession`), and polls until the session is visible to the app or retries are exhausted—matching the flow used by the demo apps.

Refresh the package README: peer dependencies, entry points, browser auth (redirects, callback, session), and development commands are documented accurately.
