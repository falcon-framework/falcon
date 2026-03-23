# FALCON SDK

This package lets third-party apps integrate with the FALCON platform: **FALCON Auth** (unified sign-on) and **FALCON Connect** (install / link apps). It ships browser primitives, optional React UI, server middleware, and Connect clients/helpers.

## Installation

```sh
bun add @falcon-framework/sdk better-auth react react-dom
```

When you use **`@falcon-framework/sdk/connect`**, also install **`zod`** (peer, `^4.1.0`).

Other package managers work too; this repo standardizes on **Bun** for scripts and local development.

`better-auth` is required whenever you use `createFalconAuth`: the client wraps Better Auth’s React client (`better-auth/react`).

### Peer dependencies

| Package       | Range    | When you need it                                                                                               |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| `better-auth` | `^1.5.0` | Always for `createFalconAuth` / `@falcon-framework/sdk/react`. Match the version your Falcon Auth server uses. |
| `react`       | `>=18`   | Main entry (`createFalconAuth`) and `@falcon-framework/sdk/react`.                                             |
| `react-dom`   | `>=18`   | Same as above.                                                                                                 |
| `zod`         | `^4.1.0` | When you import **`@falcon-framework/sdk/connect`** (HTTP client and Zod schemas).                             |

`react` and `react-dom` are **optional** peers so apps that only import `@falcon-framework/sdk/server` are not forced to install React. **`zod`** is an **optional** peer so apps that only use auth helpers are not forced to install it; **`@falcon-framework/sdk/connect` requires it at runtime.**

### Entry points

| Import path                     | Purpose                                                                                                                                                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@falcon-framework/sdk`         | Auth client (`createFalconAuth`), session helpers, redirects, OAuth callback helper (`completeAuthCallback`), cookie name, **`buildFalconConnectHeaders`**, **`organizationClient`** re-export.                                |
| `@falcon-framework/sdk/react`   | `FalconAuthProvider`, hooks (`useFalconAuth`, `useUser`, `useSession`, **`useOrganizations`**), **`ActiveOrganizationProvider`**, **`useActiveOrganization`**, **`OrganizationSwitcher`**, `SignIn` / `SignUp` / `UserButton`. |
| `@falcon-framework/sdk/server`  | `verifySession` for protecting backend routes and `mintFalconConnectAccessToken` for BFF / backend Connect calls.                                                                                                              |
| `@falcon-framework/sdk/connect` | **`createFalconConnectClient`** (Zod-validated Connect API v1), errors, exported schemas, and **display** helpers (`resolveFalconConnectionsDisplay`, …).                                                                      |

## Start Here

The package-local getting-started guides live in [`docs/`](./docs/README.md):

- [SDK docs index](./docs/README.md)
- [Auth Getting Started](./docs/auth-getting-started.md)
- [Connect Getting Started](./docs/connect-getting-started.md)

Use the package README for quick package-level reference, then move into the docs for complete walkthroughs.

## Quick Reference

### Core Auth (`@falcon-framework/sdk`)

- `createFalconAuth`
- `buildSignInUrl`, `buildSignUpUrl`
- `redirectToSignIn`, `redirectToSignUp`
- `exchangeCodeForSession`
- `completeAuthCallback`
- `fetchFalconSession`
- `signOutFalconSession`
- `sessionCookieName`
- `buildFalconConnectHeaders`
- `organizationClient`

### React (`@falcon-framework/sdk/react`)

- `FalconAuthProvider`
- `useFalconAuth`, `useUser`, `useSession`
- `useOrganizations`
- `ActiveOrganizationProvider`, `useActiveOrganization`
- `OrganizationSwitcher`
- `SignIn`, `SignUp`, `UserButton`

### Server (`@falcon-framework/sdk/server`)

- `verifySession`
- `mintFalconConnectAccessToken`

### Connect (`@falcon-framework/sdk/connect`)

- `createFalconConnectClient`
- Connect types and Zod schemas
- `FalconConnectHttpError`, `FalconConnectNetworkError`, `FalconConnectParseError`, `FalconConnectValidationError`
- display helpers such as `resolveFalconConnectionsDisplay`, `buildFalconConnectAppMap`, `displayFalconConnection`

## Docs Map

- Need browser or React Auth? Read [Auth Getting Started](./docs/auth-getting-started.md)
- Need backend session verification or BFF auth bridging? Read [Auth Getting Started](./docs/auth-getting-started.md#9-add-server-side-session-verification)
- Need Connect clients, install flows, or backend Connect tokens? Read [Connect Getting Started](./docs/connect-getting-started.md)
- Need the full docs index? Read [docs/README.md](./docs/README.md)

## Development (in this monorepo)

From the repository root:

```sh
bun install
bun run sdk:build
bun run sdk:check-types
bun run --cwd packages/sdk test
```

Or from `packages/sdk`:

```sh
bun run build
bun run check-types
bun run test
```

The published package is built with [tsdown](https://tsdown.dev/) into `dist/`.

> [!NOTE]
> The public API and docs are still evolving. Pin versions in production and review release notes when upgrading.
