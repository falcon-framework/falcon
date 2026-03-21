# Server session verification

The **`verifySession`** helper (from `@falcon-framework/sdk/server`) lets your **backend** confirm that an incoming HTTP request belongs to a signed-in Falcon user.

## Behavior

Given:

- **`serverUrl`** — Falcon Auth base URL.
- **`publishableKey`** — your app’s publishable key.
- An incoming **Request** (or headers object) that may include a **`Cookie`** header.

The helper forwards cookies to **`GET /api/auth/get-session`** on the auth server, optionally with **`X-Falcon-App-Id`**, and parses the JSON payload.

Returns **`null`** when there is no valid session; otherwise returns **user** and **session** objects mirroring Better Auth’s shape.

## When to use it

- **BFF / API routes** in your own server that must not trust client-side session flags alone.
- **Bridge services** that need a stable user id before talking to your domain databases.

## Limitations

- This verifies **Falcon Auth session**, not Falcon Connect organization membership. Connect adds its own **`X-Organization-Id`** and membership checks.
- For machine clients, consider **JWT** verification against JWKS instead of cookies.

## Related topics

- [Sessions and cookies](../falcon-auth/sessions-and-cookies.md)
- [Calling the Connect API](../falcon-connect/authentication.md)
