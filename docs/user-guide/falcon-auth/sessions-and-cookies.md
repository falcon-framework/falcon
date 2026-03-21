# Sessions and cookies

Falcon Auth builds on **Better Auth**. Sessions are created when a user signs in; the auth server sets **HTTP-only cookies** on the **auth server’s domain** (with `SameSite` and `Secure` attributes appropriate for cross-site API usage in typical deployments).

## How your SPA sees the session

The Falcon SDK’s React client calls endpoints such as **`/api/auth/get-session`** on the configured **`serverUrl`**, with **`credentials: 'include'`**. The browser attaches cookies for the auth host to those requests even when the JavaScript runs on your app’s origin, **provided** CORS allows your origin and credentials.

That means:

- The user does **not** need a session cookie on *your* app’s domain for the default SDK flow.
- Your app’s origin must be listed in the Auth app’s **`allowed_origins`** and the auth server’s CORS rules must reflect that.

## Centralized sign-in and cookies

When the user completes hosted sign-in on the auth origin, the session cookie is set in that context. When they are redirected back to your app, subsequent `get-session` calls from your origin still send that cookie to the auth host. No extra step is required in the happy path.

## Console and your apps

If the console and your product both use the **same auth server** and the **same real user accounts**, a single sign-in can cover both experiences from the browser’s perspective (same auth cookie jar). Organization and Connect data still depend on **which org** is active and which **Connect apps** exist.

## Server-side verification

Backend services that receive the browser’s `Cookie` header can forward it to **`get-session`** or use JWT verification. See [Server session verification](../sdk/server-verification.md).

## JWT option (Connect)

The Connect service can authenticate some calls using a **Bearer** token verified against the auth server’s **JWKS** (`/.well-known/jwks.json`). That path is useful for machine-to-machine or mobile patterns. Browser demos often rely on **cookies** only.

Details: [Calling the Connect API](../falcon-connect/authentication.md).

## Operational tips

- Keep **clock skew** minimal when using JWTs.
- When rotating **`BETTER_AUTH_SECRET`**, plan session invalidation carefully (Better Auth behavior applies).
- Prefer **HTTPS** everywhere in production; `Secure` cookies require it.

## Related topics

- [Centralized sign-in](centralized-sign-in.md)
- [Architecture](../getting-started/architecture.md)
