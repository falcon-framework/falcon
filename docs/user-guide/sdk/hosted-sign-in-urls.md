# Centralized sign-in URLs

For **centralized** sign-in, the browser leaves your app, loads HTML on the **Falcon Auth server origin**, then returns to your app (often with an authorization `code` in the query string). The SDK exposes URL builders that match the routes implemented by the auth server.

> **Note on paths:** Falcon Auth serves the hosted sign-in **GET** handler at **`/auth/authorize`** and sign-up at **`/auth/sign-up`**. Import builders from **`@falcon-framework/sdk`** (the React entry does not re-export these).

## Functions

```ts
import {
  buildSignInUrl,
  buildSignUpUrl,
  redirectToSignIn,
  redirectToSignUp,
} from "@falcon-framework/sdk";
```

### `buildSignInUrl(config, { redirectUri, state? })`

Returns an absolute URL:

- **Path:** `/auth/authorize`
- **Query:** `client_id=<publishableKey>`, `redirect_uri=<redirectUri>`, and `state` when provided

### `buildSignUpUrl(config, { redirectUri, state? })`

Same pattern for **`/auth/sign-up`**.

### `redirectToSignIn` / `redirectToSignUp`

Assigns `window.location.href` to the corresponding built URL. **Browser only.**

## Choosing `redirectUri`

1. Use a **full URL** (`https://app.example.com/auth/callback`, `http://localhost:3010/dashboard`).
2. Register it **exactly** (character-for-character) in your app’s **`falcon_auth_app.redirect_urls`**.
3. Ensure the **origin** of that URL appears in **`allowed_origins`** so Better Auth accepts it as a trusted redirect target.

## Optional `state` (CSRF)

Before redirecting, generate an opaque value (for example `crypto.randomUUID()`), store it (for example `sessionStorage`), and pass it as `state`. The auth server returns it on the callback query string; validate it before exchanging the `code` (or use [`completeAuthCallback`](auth-callback-and-session.md)).

## Examples

### Full-page navigation to sign-in

```ts
import { redirectToSignIn } from "@falcon-framework/sdk";

const config = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};

redirectToSignIn(config, {
  redirectUri: `${window.location.origin}/auth/callback`,
  state: crypto.randomUUID(),
});
```

Remember to persist `state` before calling `redirectToSignIn` (for example `sessionStorage.setItem("falcon_auth_state", state)`).

### Build a URL without navigating

```ts
import { buildSignInUrl } from "@falcon-framework/sdk";

const url = buildSignInUrl(config, {
  redirectUri: "https://app.example.com/auth/callback",
});
// Open in a new tab, pass to a mobile WebView, etc.
```

### Router-friendly “sign-in” route

A `/sign-in` page can check session first, then redirect once (avoid calling `redirectToSignIn` on every render):

```tsx
import { useEffect } from "react";
import { useFalconAuth } from "@falcon-framework/sdk/react";
import { redirectToSignIn } from "@falcon-framework/sdk";
import type { FalconAuthConfig } from "@falcon-framework/sdk";

function SignInGate({ config }: { config: FalconAuthConfig }) {
  const { isLoaded, isSignedIn } = useFalconAuth();

  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem("falcon_auth_state", state);
    redirectToSignIn(config, {
      redirectUri: `${window.location.origin}/auth/callback`,
      state,
    });
  }, [isLoaded, isSignedIn, config]);

  if (!isLoaded) return <p>Loading…</p>;
  if (isSignedIn) return <p>Already signed in.</p>;
  return <p>Redirecting…</p>;
}
```

## Related topics

- [Auth callback and session](auth-callback-and-session.md)
- [Centralized sign-in](../falcon-auth/centralized-sign-in.md)
- [App registration](../falcon-auth/app-registration.md)
