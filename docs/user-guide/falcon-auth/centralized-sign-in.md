# Centralized sign-in (hosted UI)

Falcon Auth supports a **hosted** sign-in and sign-up experience on the **auth server’s origin**, similar in user experience to centralized providers like Clerk: the user leaves your application briefly, authenticates on Falcon, then returns to your app already signed in.

## Why use hosted sign-in?

- **Consistent branding and UX** for authentication on one domain you control.
- **Clear security boundary**: credentials are submitted directly to the auth server origin, which simplifies reasoning about cookies and CSRF for the login step.
- **Alignment with allow lists**: each return URL is explicitly registered.

Embedded forms in your own SPA are still possible via the SDK, but many teams prefer the redirect model for production.

## User-visible flow

1. The user clicks “Sign in” (or similar) in your app.
2. Your app sends the browser to a URL on the auth server:
   - Sign-in: `GET /auth/authorize`
   - Sign-up: `GET /auth/sign-up`
3. Query parameters:
   - **`client_id`** — your app’s **publishable key** (for example `pk_demo_source`). This identifies the Falcon Auth client registration.
   - **`redirect_uri`** — a **full URL** (with `http` or `https`) where the user should land after success. Example: `https://app.example.com/dashboard`.
4. The auth server checks that:
   - `client_id` resolves to a registered **`falcon_auth_app`** row.
   - `redirect_uri` is **exactly** listed in that row’s **`redirect_urls`** JSON array (open-redirect protection).
5. The user enters email and password on the hosted page. The page calls the normal Better Auth endpoints (`/api/auth/sign-in/email` or `/api/auth/sign-up/email`) with:
   - Header **`X-Falcon-App-Id`** with your publishable key as the value, so Falcon can link the user to your app and apply trusted origins.
   - Body field **`callbackURL`** set to `redirect_uri` for sign-in (Better Auth uses this to signal a browser redirect in the JSON response).
6. After sign-in, the browser navigates to **`redirect_uri`**, often with **`code`** and **`state`** query parameters. Exchange the code with the SDK ([Auth callback and session](../sdk/auth-callback-and-session.md)), then call **`get-session`** on the auth server with **credentials included**; the session cookie was set on the auth domain during login, so the user is recognized.

## Building the hosted URL in your app

Use the SDK helpers (recommended):

- `buildSignInUrl(config, { redirectUri, state? })` → `/auth/authorize`
- `buildSignUpUrl(config, { redirectUri, state? })` → `/auth/sign-up`
- Or `redirectToSignIn` / `redirectToSignUp` for a full-page navigation

See [Centralized sign-in URLs](../sdk/hosted-sign-in-urls.md) and [Auth callback and session](../sdk/auth-callback-and-session.md).

## Registration requirements

For hosted sign-in to succeed:

1. **`allowed_origins`** on your `falcon_auth_app` must include your app’s **origin** (scheme + host + port), so Better Auth accepts your `callbackURL` as a trusted redirect target.
2. **`redirect_urls`** must include each **`redirect_uri`** you pass to `/auth/authorize` or `/auth/sign-up`, **character-for-character** (including trailing slashes if used).

Example: if you redirect to `http://localhost:3010/dashboard`, the database must list exactly `http://localhost:3010/dashboard`, not only `http://localhost:3010`.

## Hosted sign-up behavior

Sign-up via Better Auth returns a session token in JSON when email verification is not blocking auto sign-in. The hosted page redirects the browser to **`redirect_uri`** after a successful sign-up response. Ensure that URL is allowlisted the same way as for sign-in.

## Troubleshooting

| Symptom                                    | Things to check                                                                                                                          |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| “Unknown client_id”                        | Publishable key mismatch; row missing in `falcon_auth_app`.                                                                              |
| “redirect_uri is not allowed”              | Add exact URL to `redirect_urls`; re-run seed or migrate.                                                                                |
| “Invalid callbackURL” from API             | `allowed_origins` missing the **origin** of `redirect_uri`.                                                                              |
| User returns to app but appears signed out | SDK not using `credentials: 'include'`; CORS on auth server blocking your origin; third-party cookie policies in unusual browser setups. |

## Related topics

- [App registration](app-registration.md)
- [Sessions and cookies](sessions-and-cookies.md)
- [Architecture](../getting-started/architecture.md)
