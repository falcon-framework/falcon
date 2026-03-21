# Reference

Quick-reference material for operators and integrators.

| Document | Description |
| -------- | ----------- |
| [Environment variables](environment-variables.md) | Common bindings by service |
| [Permissions matrix](permissions-matrix.md) | Connect capabilities by org role |

## Source of truth

Behavior may evolve with the codebase. When in doubt, prefer:

- Auth: Better Auth route definitions and Falcon-specific middleware in the auth server.
- Connect: `FalconConnectionApi` schema in the `@falcon-framework/connection` package.
- Database: Drizzle schema under `@falcon-framework/db/schema`.
