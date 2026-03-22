---
"@falcon-framework/sdk": patch
---

Declare **zod** as an **optional peer dependency** (`^4.1.0`) instead of a `catalog:` runtime dependency, so the published `package.json` uses explicit semver ranges suitable for npm consumers.

**Migration:** when using `@falcon-framework/sdk/connect`, install **zod** in your application (for example `bun add zod`). The Connect entry imports Zod at runtime for validation.
