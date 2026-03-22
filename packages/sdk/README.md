# FALCON SDK

This package lets third-party apps integrate with the FALCON platform: **FALCON Auth** (unified sign-on) and **FALCON Connect** (install / link apps). It ships browser primitives, optional React UI, server middleware, and Connect labeling helpers.

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
| `@falcon-framework/sdk/server`  | `verifySession` for protecting backend routes.                                                                                                                                                                                 |
| `@falcon-framework/sdk/connect` | **`createFalconConnectClient`** (Zod-validated Connect API v1), errors, exported schemas, and **display** helpers (`resolveFalconConnectionsDisplay`, …).                                                                       |

## Falcon Auth (browser)

### Configuration

Use a publishable key and your Falcon Auth server base URL (see your project / dashboard). Pass that config to the helpers below.

### Sign-in and sign-up redirects

- `buildSignInUrl` / `buildSignUpUrl` — build authorize URLs.
- `redirectToSignIn` / `redirectToSignUp` — navigate the browser (client-side only).

For CSRF protection, generate opaque `state` (e.g. `crypto.randomUUID()`), store it (e.g. `sessionStorage`), and pass it into the redirect options. The auth server returns it on the callback query string.

### Auth callback route

After redirect, your app loads with `code` (and usually `state`) in the query string.

1. Read `state` from storage and compare to the query `state`.
2. Call `exchangeCodeForSession(config, { code })` to exchange the code for a session (the auth server sets cookies on its origin).
3. Confirm the session is visible to your app (e.g. with `fetchFalconSession`).

`completeAuthCallback` bundles steps 1–3: it validates `code` and `state`, runs your `exchangeCode` (typically wrapping `exchangeCodeForSession`), then polls `getSession` until both `user` and `session` appear or retries are exhausted.

Example shape (framework-agnostic):

```ts
import {
  completeAuthCallback,
  exchangeCodeForSession,
  fetchFalconSession,
} from "@falcon-framework/sdk";

await completeAuthCallback({
  code,
  state,
  storedState: sessionStorage.getItem("falcon_auth_state"),
  exchangeCode: (authCode) => exchangeCodeForSession(config, { code: authCode }),
  getSession: async () => ({ data: await fetchFalconSession(config) }),
});
```

Then redirect the user to your post-login page (full-page navigation is recommended so UI picks up the new session).

### Session and sign-out

- `fetchFalconSession(config)` — GET session from the Falcon Auth server with `credentials: "include"` and app-scoped headers.
- `signOutFalconSession(config)` — sign out the browser session on the auth server.

### Cookies

- `sessionCookieName` — cookie name pattern used for app-scoped session tokens (useful for debugging and server-side parsing).

## React (`@falcon-framework/sdk/react`)

Wrap your app with `FalconAuthProvider`, use `useFalconAuth` / `useUser` / `useSession`, **`useOrganizations`** (list + **`create`** / **`setActive`** helpers) or optionally **`ActiveOrganizationProvider`** / **`useActiveOrganization`** and **`OrganizationSwitcher`** for Better Auth organizations, or drop in `SignIn`, `SignUp`, and `UserButton`. The React entry re-exports `createFalconAuth` and core types for convenience.

## Organizations and Connect

- **`buildFalconConnectHeaders({ publishableKey, organizationId, init? })`** — sets **`X-Falcon-App-Id`** and **`X-Organization-Id`** for Falcon Connect API calls from the browser or server.
- Session payloads may include **`activeOrganizationId`** on **`session`** and optional **`activeOrganization`** / **`organizations`** when using the organization plugin; see **`docs/user-guide/sdk/organizations.md`** in the Falcon repo.

Create an organization with the Better Auth client from **`useFalconAuth()`**, or use **`useOrganizations()`** for the same APIs with a single hook:

```tsx
import { useFalconAuth } from "@falcon-framework/sdk/react";

const { client } = useFalconAuth();
const result = await client.organization.create({ name: "My team", slug: "my-team" });
if (!result.error && result.data?.id) {
  await client.organization.setActive({ organizationId: result.data.id });
}
```

## Server (`@falcon-framework/sdk/server`)

Use `verifySession` in API routes or middleware to require a valid Falcon session (e.g. from cookies forwarded by your backend).

## Connect (`@falcon-framework/sdk/connect`)

Helpers to resolve and display installed Connect apps and connection labels (`buildFalconConnectAppMap`, `displayFalconConnection`, etc.).

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
