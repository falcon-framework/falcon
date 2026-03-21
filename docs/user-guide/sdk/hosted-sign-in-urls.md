# Hosted sign-in URL helpers

When using the **centralized** Falcon Auth experience, your application should send users to the auth server’s hosted pages with the correct query string.

## Functions

```ts
import {
  buildFalconHostedSignInUrl,
  buildFalconHostedSignUpUrl,
} from "@falcon-framework/sdk/react";
// or: "@falcon-framework/sdk"
```

### `buildFalconHostedSignInUrl(config, { redirectUri })`

Returns an absolute URL:

- Path: `/hosted/sign-in`
- Query: `client_id=<publishableKey>&redirect_uri=<encoded redirectUri>`

### `buildFalconHostedSignUpUrl(config, { redirectUri })`

Same pattern for `/hosted/sign-up`.

## Choosing `redirectUri`

- Must be a **full URL** (`http://localhost:3010/dashboard`, `https://app.example.com/onboarding/done`).
- Must appear **exactly** in your **`falcon_auth_app.redirect_urls`** array.
- Its **origin** must be allowed in **`allowed_origins`** so Better Auth accepts it as `callbackURL` on sign-in.

## Typical usage patterns

### Full-page navigation (recommended)

```ts
window.location.href = buildFalconHostedSignInUrl(config, {
  redirectUri: `${appPublicOrigin}/dashboard`,
});
```

### Router-friendly landing route

A `/sign-in` route in your SPA can immediately redirect to the hosted URL after checking `useFalconAuth().isSignedIn` to skip unnecessary round trips.

## Related topics

- [Centralized sign-in](../falcon-auth/centralized-sign-in.md)
- [App registration](../falcon-auth/app-registration.md)
