# Falcon JavaScript SDK

The package **`@falcon-framework/sdk`** integrates browser apps and backends with **Falcon Auth** (sessions, OAuth-style redirects, optional React UI) and optional **Falcon Connect** display helpers.

## Install

```sh
npm install @falcon-framework/sdk better-auth react react-dom
```

| Peer dependency | When you need it |
| --------------- | ---------------- |
| `better-auth` `^1.5.0` | Required for `createFalconAuth` and `@falcon-framework/sdk/react` (wraps Better Auth’s React client). Match the version your Falcon Auth server uses. |
| `react` / `react-dom` `>=18` | Main entry and `@falcon-framework/sdk/react`. **Optional** in `package.json` if you only use `@falcon-framework/sdk/server` or `@falcon-framework/sdk/connect`. |

## Topics

| Document | Description |
| -------- | ----------- |
| [React integration](react-integration.md) | `FalconAuthProvider`, hooks, `SignIn` / `SignUp` / `UserButton` |
| [Centralized sign-in URLs](hosted-sign-in-urls.md) | `buildSignInUrl` / `buildSignUpUrl`, `redirectToSignIn` / `redirectToSignUp` (auth server `/auth/*` routes) |
| [Auth callback and session](auth-callback-and-session.md) | `completeAuthCallback`, `exchangeCodeForSession`, `fetchFalconSession`, sign-out, cookies |
| [Server session verification](server-verification.md) | `verifySession` for APIs and middleware |
| [Connect display helpers](connect-helpers.md) | Pure helpers under `@falcon-framework/sdk/connect` |

## Package entry points

| Import path | Purpose |
| ----------- | ------- |
| `@falcon-framework/sdk` | `createFalconAuth`, session helpers, redirect URL builders, `exchangeCodeForSession`, `completeAuthCallback`, `sessionCookieName` |
| `@falcon-framework/sdk/react` | `FalconAuthProvider`, `useFalconAuth` / `useUser` / `useSession`, `SignIn`, `SignUp`, `UserButton`; re-exports `createFalconAuth` and core types |
| `@falcon-framework/sdk/server` | `verifySession` |
| `@falcon-framework/sdk/connect` | Connect app map and connection labeling helpers (no HTTP) |

## UI stack (React)

Pre-built components use **Tailwind CSS** and class names consistent with shadcn-style tokens. Align your app’s theme with the Falcon demos if you want matching visuals.

## Related reading

- [Falcon Auth overview](../falcon-auth/README.md)
- [Centralized sign-in](../falcon-auth/centralized-sign-in.md) (product flow; URL builders live in this SDK section)
- [Falcon Connect overview](../falcon-connect/README.md)
- [Package README](../../../packages/sdk/README.md) (npm-focused quick reference)
