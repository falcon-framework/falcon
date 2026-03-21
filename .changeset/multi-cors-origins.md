---
"@falcon-framework/sdk": patch
---

Support **comma-separated** `CORS_ORIGIN` values when running Falcon Auth: the auth server’s CORS allow-list and Better Auth **trusted origins** (in `@falcon-framework/auth`) now parse `CORS_ORIGIN` as a list (split on commas, trimmed). You can list several first-party origins in one variable—for example the console and multiple local demo apps on different ports—without relying on a single origin string.

**Migration:** If you already use a single origin, behavior is unchanged. To allow multiple origins, set `CORS_ORIGIN` to a comma-separated list (no spaces required, but surrounding spaces around each entry are trimmed).
