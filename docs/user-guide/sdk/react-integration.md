# React: provider, hooks, and components

## Configuration object

The SDK expects:

- **`serverUrl`** — public base URL of the Falcon Auth server (no trailing slash required; normalize consistently).
- **`publishableKey`** — value of **`X-Falcon-App-Id`** for your **`falcon_auth_app`** row.

```ts
const config = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};
```

## `FalconAuthProvider`

Wrap your tree so hooks and components can access the Better Auth–compatible client:

```tsx
import { FalconAuthProvider } from "@falcon-framework/sdk/react";

export function App() {
  return (
    <FalconAuthProvider config={config}>
      <Routes />
    </FalconAuthProvider>
  );
}
```

## Hooks

### `useFalconAuth()`

Returns:

- **`user`**, **`session`** — from `useSession()` under the hood.
- **`isLoaded`**, **`isSignedIn`** — derived readiness flags.
- **`signOut`** — Better Auth sign-out function.
- **`client`** — raw client for advanced calls.

### `useUser()` / `useSession()`

Convenience subsets of the same state.

## Optional UI components

The SDK ships **SignIn** and **SignUp** forms that POST through the configured client (embedded UX on your origin). Many production apps instead use [hosted sign-in](hosted-sign-in-urls.md).

**UserButton** renders a compact account control with sign-out, suitable for headers.

## Better Auth client behavior

The Falcon client injects **`X-Falcon-App-Id`** on fetch calls automatically so the auth server can resolve your **`falcon_auth_app`** registration.

Default fetch plugins include Better Auth’s **redirect** helper: when an endpoint returns `{ redirect: true, url }`, the client may set `window.location` automatically (relevant for some flows with `callbackURL`).

## Organizations in your SPA

The stock SDK docs focus on **session**. Organization **create / list / setActive** APIs come from Better Auth’s **organization client plugin** if you add it the same way the console does. Demos combine Falcon Auth sessions with org-aware Connect calls.

See [Organizations](../falcon-auth/organizations.md).

## Related topics

- [Centralized sign-in](../falcon-auth/centralized-sign-in.md)
- [Sessions and cookies](../falcon-auth/sessions-and-cookies.md)
