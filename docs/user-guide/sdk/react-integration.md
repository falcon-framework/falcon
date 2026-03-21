# React: provider, hooks, and components

## Configuration object

The SDK expects:

- **`serverUrl`** — public base URL of the Falcon Auth server (trailing slash is tolerated; stay consistent across your app).
- **`publishableKey`** — sent as **`X-Falcon-App-Id`** and must match your **`falcon_auth_app`** row.

```ts
import type { FalconAuthConfig } from "@falcon-framework/sdk";

const config: FalconAuthConfig = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};
```

## `FalconAuthProvider`

Creates a Better Auth–compatible client with **`X-Falcon-App-Id`** injected on every request. Wrap your tree so hooks and components can access it:

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

The provider memoizes the client on **`serverUrl`** and **`publishableKey`**. Changing those will recreate the client and re-fetch session state in child hooks.

## Hooks

### `useFalconAuth()`

Returns:

| Field                      | Description                                                                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **`user`** / **`session`** | Loaded from **`fetchFalconSession(config)`** on mount and when config changes.                                         |
| **`isLoaded`**             | `false` until the first session read finishes.                                                                         |
| **`isSignedIn`**           | `isLoaded && !!user`.                                                                                                  |
| **`signOut`**              | Calls **`signOutFalconSession`**, then clears hook state.                                                              |
| **`client`**               | Better Auth React client from **`createFalconAuth`**, with **`organizationClient`** plugin—use for advanced API calls. |

```tsx
import { useFalconAuth } from "@falcon-framework/sdk/react";

function Header() {
  const { user, isLoaded, isSignedIn, signOut } = useFalconAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <a href="/sign-in">Sign in</a>;

  return (
    <div>
      <span>{user?.name}</span>
      <button type="button" onClick={() => void signOut()}>
        Sign out
      </button>
    </div>
  );
}
```

### `useUser()` / `useSession()`

Convenience wrappers: **`useUser`** returns **`{ user, isLoaded }`**; **`useSession`** returns **`{ session, isLoaded }`**.

These are **Falcon SDK** helpers (they call **`fetchFalconSession`**). They are unrelated to Better Auth’s own React **`useSession`** hook on the raw Better Auth client; when you need organization APIs, use **`useFalconAuth().client`** or the org components below.

## Optional UI components

| Component                                                      | Role                                                                                                                                                                          |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`SignIn`**                                                   | Email + password form posting through the Better Auth client (embedded UX on **your** origin). Props: **`afterSignInUrl`**, **`signUpUrl`**, **`onSignIn`**, **`className`**. |
| **`SignUp`**                                                   | Same idea for registration.                                                                                                                                                   |
| **`UserButton`**                                               | Compact account control with sign-out—suitable for headers.                                                                                                                   |
| **`ActiveOrganizationProvider`** / **`useActiveOrganization`** | Persists active org id and syncs **`organization.setActive`** (nested inside **`FalconAuthProvider`**).                                                                       |
| **`OrganizationSwitcher`**                                     | Tailwind dropdown to switch organizations; optional create/settings links.                                                                                                    |

Components use **Tailwind CSS** utility classes. Many production apps prefer redirecting to the auth server instead; see [Centralized sign-in URLs](hosted-sign-in-urls.md) and [Auth callback and session](auth-callback-and-session.md).

```tsx
import { SignIn } from "@falcon-framework/sdk/react";

export function LoginPage() {
  return <SignIn afterSignInUrl="/dashboard" signUpUrl="/sign-up" />;
}
```

## Better Auth client behavior

- **`X-Falcon-App-Id`** is set automatically on the custom fetch used by the client.
- Default plugins include Better Auth’s **organization** client—see [Organizations](../falcon-auth/organizations.md) for org APIs used alongside Falcon sessions.
- When an endpoint returns **`{ redirect: true, url }`**, the client may set **`window.location`** (relevant for some flows with **`callbackURL`**).

## Organizations in your SPA

Session and user come from Falcon Auth; organization **create / list / setActive** flows use Better Auth’s organization plugin on the same **`client`**.

- Use **`ActiveOrganizationProvider`** and **`useActiveOrganization`** for a shared “active org” pattern (see [Organizations](organizations.md)).
- Use **`OrganizationSwitcher`** for a minimal org switcher, or build your own with **`client.useListOrganizations()`** and **`switchOrg`** from the provider context.
- For Falcon Connect **`fetch`** calls, combine **`buildFalconConnectHeaders`** (main SDK entry) with your **`X-Organization-Id`**.

The console and demos use the same provider from the SDK with app-specific **`storageKey`** values.

## Related topics

- [Centralized sign-in URLs](hosted-sign-in-urls.md)
- [Auth callback and session](auth-callback-and-session.md)
- [Centralized sign-in](../falcon-auth/centralized-sign-in.md)
- [Sessions and cookies](../falcon-auth/sessions-and-cookies.md)
