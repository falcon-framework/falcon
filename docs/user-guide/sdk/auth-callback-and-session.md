# Auth callback and session

After the user finishes on the auth server, the browser returns to your **`redirect_uri`**, usually with **`code`** and optionally **`state`** query parameters. This page covers exchanging the code, confirming the session, and reading or clearing it from your app.

## Overview

| Step | What happens                                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | User lands on your callback route with `?code=…&state=…`.                                                                                                        |
| 2    | Optionally verify **`state`** against the value you stored before redirect.                                                                                      |
| 3    | Call **`exchangeCodeForSession`** so the auth server can set the per-app session cookie on its origin.                                                           |
| 4    | Poll **`fetchFalconSession`** (or your Better Auth client’s `getSession`) until **user** and **session** are visible—browsers can be slightly asynchronous here. |
| 5    | Navigate to your post-login destination (full page navigation is recommended so all UI picks up the new session).                                                |

**`completeAuthCallback`** bundles steps 2–4 with sensible defaults.

## `exchangeCodeForSession(config, { code })`

`POST` to the auth server’s **`/auth/token`** with JSON `{ code, client_id }` and `credentials: "include"`. On success, returns `{ sessionToken }`; the auth server also sets cookies on its host.

Use this inside your callback handler after reading `code` from the URL.

## `completeAuthCallback(options)`

Validates **`code`** (required) and **`state`** vs **`storedState`** when you used `state` at authorize time, then:

1. Calls **`exchangeCode`** with the code (typically wrapping `exchangeCodeForSession`).
2. Polls **`getSession`** up to **`maxSessionChecks`** (default **3**) with **`retryDelayMs`** between attempts (default **100**).

Throws if the code is missing, state mismatches, exchange fails, or session never becomes visible.

### Example (callback route)

```ts
import {
  completeAuthCallback,
  exchangeCodeForSession,
  fetchFalconSession,
} from "@falcon-framework/sdk";

const config = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};

// Inside your handler (e.g. React useEffect on /auth/callback):
const storedState = sessionStorage.getItem("falcon_auth_state");
sessionStorage.removeItem("falcon_auth_state");

await completeAuthCallback({
  code,
  state,
  storedState,
  exchangeCode: (authCode) => exchangeCodeForSession(config, { code: authCode }),
  getSession: async () => ({ data: await fetchFalconSession(config) }),
});

window.location.replace("/dashboard");
```

### `getSession` shape

`getSession` should return **`{ data: { user, session } }`** when signed in—matching **`fetchFalconSession`** or Better Auth’s `getSession()` wrapper.

## `fetchFalconSession(config)`

`GET` **`/api/auth/get-session`** on the auth server with:

- `credentials: "include"`
- Header **`X-Falcon-App-Id: <publishableKey>`**

Returns **`null`** if unauthenticated; otherwise **`{ user, session }`**.

Use this anywhere you need a fresh read of the server-side session (including after navigation back from hosted sign-in **without** an OAuth code, if the cookie was already set).

## `signOutFalconSession(config)`

`POST` **`/api/auth/sign-out`** with the same credentials and app header. The React hook **`useFalconAuth().signOut`** calls this and clears local hook state.

## `sessionCookieName(publishableKey)`

Returns the cookie **name** used for the per-app session token, e.g. `falcon_pk_live_abc123.session_token` (sanitized). Useful for debugging or custom server-side parsing—not usually needed in typical SPA flows.

## Related topics

- [Centralized sign-in URLs](hosted-sign-in-urls.md)
- [Sessions and cookies](../falcon-auth/sessions-and-cookies.md)
- [React integration](react-integration.md)
