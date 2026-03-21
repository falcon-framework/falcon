# Falcon Auth and Connect Integration Notes

This document captures the regressions, root causes, fixes, and operational lessons from the recent Falcon Auth and Falcon Connect debugging phase across `auth-server`, `connect-service`, `packages/sdk`, `packages/auth`, `packages/connection`, `demo-01`, and `demo-02`.

The main reason to keep this document is that these failures were not random. They came from a small set of cross-origin assumptions that are easy to reintroduce later:

- app-scoped session cookies only work when every request carries the app id
- cross-origin browser auth flows behave differently on `http://localhost` vs deployed `https://...`
- callback success is not the same thing as session visibility
- client-side SPA navigation can preserve stale auth state if the app shell is not explicitly refreshed

## What Broke

### 1. Hosted sign-in redirected back correctly, but the demos still looked signed out

Observed behavior:

- `demo-01` and `demo-02` redirected to the hosted Falcon Auth UI correctly
- sign-in/sign-up succeeded
- the browser returned to `/auth/callback`
- the app still rendered the anonymous state

### 2. In local development, the callback could exchange the auth code, but the browser still had no usable app session

Observed behavior:

- `/auth/token` returned `200`
- the callback route ran
- `get-session` remained anonymous
- browser cookie state did not match expectations for app-scoped auth

### 3. After sign-in started working, the app shell sometimes still needed a manual refresh

Observed behavior:

- the session existed
- a raw request to Falcon Auth could resolve it
- the app UI sometimes did not immediately reflect it after returning from the callback

### 4. Falcon Connect requests from the demos failed with `Unauthorized`

Observed behavior:

- the user was signed in
- the source app showed the "Connect to partner app" button
- clicking it failed because `connect-service` treated the request as anonymous

## Root Causes

## A. App-scoped Falcon Auth sessions depend on `X-Falcon-App-Id`

Falcon Auth does not treat these demo apps as one global shared browser session. It uses per-app cookie prefixes:

- `falcon_pk_demo_source.session_token`
- `falcon_pk_demo_target.session_token`

The auth server only resolves those correctly when requests include `X-Falcon-App-Id`.

This mattered in two places:

- browser session reads against `/api/auth/get-session`
- `connect-service` session verification when it proxied cookies to Falcon Auth

If the header was missing, Falcon Auth returned `null` even when the cookie existed.

## B. `http://localhost` cannot use deployed cross-site cookie attributes

Deployed cross-origin cookies want:

- `SameSite=None`
- `Secure`

But on plain local HTTP, browsers reject `Secure` cookies. That caused the app-scoped cookie emitted by `/auth/token` to be dropped locally.

Result:

- the code exchange looked successful
- the browser never retained the app cookie
- later auth checks always resolved anonymous

The fix was to make cookie attributes environment-sensitive:

- local HTTP: `SameSite=Lax`, `Secure=false`
- deployed HTTPS: `SameSite=None`, `Secure=true`

## C. Successful callback code exchange is not enough

The original callback behavior assumed:

1. exchange code
2. trust that the cookie is usable
3. navigate away

That was too optimistic. The correct invariant is:

1. exchange code
2. verify session visibility from the app context
3. only then continue

Without that verification step, the app could silently land back on a signed-out page and make debugging harder.

## D. SPA navigation can preserve stale auth state

Even after session visibility was fixed, callback completion through client-side router navigation could leave the shell showing stale anonymous state until a full reload.

This was not a token-storage issue. It was a state freshness issue in the app runtime.

The practical fix was to use a full-page redirect from the callback route after successful verification:

- `window.location.replace('/dashboard')` in `demo-01`
- `window.location.replace('/')` in `demo-02`

## E. Connect-service had the cookie, but not the app id

`connect-service` accepted:

- cookies
- `X-Organization-Id`

But it was not receiving or forwarding `X-Falcon-App-Id`.

That meant `packages/connection/src/principal.ts` proxied only the cookie to Falcon Auth:

- Falcon Auth saw no app id
- app-scoped session resolution failed
- connection endpoints returned `401 Unauthorized`

## What Was Changed

## 1. Auth cookie behavior

Files:

- [`packages/auth/src/index.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/auth/src/index.ts)
- [`apps/auth-server/src/index.ts`](/Users/benn/Documents/Projects/dzwei/falcon/apps/auth-server/src/index.ts)

Changes:

- added `authCookieAttributes(baseUrl)` to centralize cookie policy
- used localhost-safe cookie attributes for plain HTTP
- reused the same cookie policy in `/auth/token`

This keeps Better Auth session cookies and Falcon Auth authorization-code exchange cookies aligned.

## 2. SDK auth transport

Files:

- [`packages/sdk/src/core/client.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/sdk/src/core/client.ts)
- [`packages/sdk/src/core/session.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/sdk/src/core/session.ts)
- [`packages/sdk/src/react/hooks.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/sdk/src/react/hooks.ts)
- [`packages/sdk/src/index.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/sdk/src/index.ts)
- [`packages/sdk/src/core/redirect.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/sdk/src/core/redirect.ts)

Changes:

- wrapped auth client fetches so they always include:
  - `credentials: "include"`
  - `X-Falcon-App-Id`
- added explicit low-level helpers:
  - `fetchFalconSession`
  - `signOutFalconSession`
- moved the shared React auth hook onto the explicit Falcon session fetch path
- updated redirect/code-exchange docs to reflect the real cross-origin flow

Important detail:

- raw session fetches proved more trustworthy than implicitly relying on Better Auth’s default dynamic hook path for this integration

## 3. Demo auth callbacks

Files:

- [`packages/sdk/src/core/auth-callback.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/sdk/src/core/auth-callback.ts) — `completeAuthCallback` (shared SDK helper)
- [`apps/demo-01/src/routes/auth/callback.tsx`](/Users/benn/Documents/Projects/dzwei/falcon/apps/demo-01/src/routes/auth/callback.tsx)
- [`apps/demo-02/src/routes/auth/callback.tsx`](/Users/benn/Documents/Projects/dzwei/falcon/apps/demo-02/src/routes/auth/callback.tsx)

Changes:

- extracted callback completion into a testable helper in `@falcon-framework/sdk`
- validated `code`
- validated `state`
- exchanged the authorization code
- retried session visibility a few times
- surfaced a specific failure when exchange succeeded but session visibility still failed
- switched final navigation to full-page redirects

## 4. Connect auth propagation

Files:

- [`apps/demo-01/src/lib/connect-client.ts`](/Users/benn/Documents/Projects/dzwei/falcon/apps/demo-01/src/lib/connect-client.ts)
- [`apps/demo-02/src/lib/connect-client.ts`](/Users/benn/Documents/Projects/dzwei/falcon/apps/demo-02/src/lib/connect-client.ts)
- [`apps/connect-service/src/index.ts`](/Users/benn/Documents/Projects/dzwei/falcon/apps/connect-service/src/index.ts)
- [`packages/connection/src/principal.ts`](/Users/benn/Documents/Projects/dzwei/falcon/packages/connection/src/principal.ts)

Changes:

- demo connect clients now send `X-Falcon-App-Id`
- connect-service CORS now allows `X-Falcon-App-Id`
- connection principal resolution now forwards `X-Falcon-App-Id` when calling Falcon Auth `get-session`

## Verified Outcomes

Observed in browser after fixes:

- `demo-01` sign-in returns directly to `/dashboard` without a manual refresh
- `demo-01` renders the signed-in user menu immediately
- `demo-02` sign-in returns to the home page in signed-in state
- `Connect to partner app` from `demo-01` opens the partner approval page instead of failing with `Unauthorized`

## Rules To Preserve

If any of these are violated later, this system is likely to regress.

### 1. Any app-scoped auth request must include the app id

For browser calls to Falcon Auth, include:

- `credentials: "include"`
- `X-Falcon-App-Id`

For service-to-service verification of browser sessions, forward:

- the incoming `cookie`
- `X-Falcon-App-Id` when present

This applies to:

- Falcon Auth session reads
- sign-out
- any backend proxy that resolves Falcon Auth sessions

### 2. Do not hard-code `SameSite=None; Secure` for localhost HTTP

Local development and deployed cross-origin behavior need different cookie attributes.

If this gets simplified back to a single hard-coded cookie policy, local auth will likely break again.

### 3. Treat callback completion as a 2-step success condition

The callback is only successful if both are true:

- the auth code exchange succeeded
- the session is readable immediately afterward from the app context

Do not remove the post-exchange session check unless the architecture changes substantially.

### 4. Be careful with client-side auth state caching

If a future refactor reintroduces purely client-side callback navigation, verify that:

- the landing page sees the fresh session immediately
- the header/user menu updates without a reload
- protected routes do not bounce back to `/sign-in`

### 5. Connect-service auth is not “generic session auth”

It is app-aware session auth.

If `X-Falcon-App-Id` disappears from:

- browser request headers
- service CORS allow-list
- principal forwarding logic

then connect endpoints will fail again even though the user appears signed in in the demo UI.

## Debugging Checklist

When Falcon Auth or Falcon Connect breaks again, check these first.

### Browser session problems

1. Does `/auth/token` return `200`?
2. Does the browser store the expected cookie name?
3. Is the cookie name app-scoped, for example `falcon_pk_demo_source.session_token`?
4. Are the cookie attributes valid for the current environment?
5. Does a raw browser `fetch('/api/auth/get-session', { credentials: 'include', headers: { 'X-Falcon-App-Id': ... } })` return a real session?
6. Does the same request without the app id return `null`?

If yes, the issue is almost certainly header propagation, not cookie issuance.

### Callback problems

1. Is the `state` present in `sessionStorage` before redirect?
2. Does the callback receive the same `state` back?
3. Does `exchangeCodeForSession` succeed?
4. Does immediate session verification succeed?
5. Does the final landing page render signed-in state without requiring a manual refresh?

### Connect unauthorized problems

1. Does the demo app send `X-Organization-Id`?
2. Does the demo app send `X-Falcon-App-Id`?
3. Does `connect-service` allow that header in CORS?
4. Does `packages/connection/src/principal.ts` forward `X-Falcon-App-Id` to Falcon Auth?
5. Does Falcon Auth `get-session` return a real session when called with the forwarded cookie and app id?

## Localhost-Specific Caveats

- `localhost` cross-origin auth is still subtle even when working correctly
- browser cookie behavior on `http://localhost` is more permissive in some ways and stricter in others
- if local auth starts failing after cookie changes, inspect the browser cookie jar first before assuming a server-side regression
- do not assume a cookie visible on the auth server origin is enough; verify the exact app-scoped cookie name that the integration expects

## Residual Risks

- the SDK package currently depends on a built `dist/` output for the demos’ runtime behavior in this workspace, so source edits in `packages/sdk/src` may not take effect in running demos until the package is rebuilt
- the broader demo Vitest setup still has an unrelated startup issue (`ReferenceError: module is not defined` via `tiny-warning`), so focused unit tests were more reliable than full app test scripts during this debugging cycle
- the custom Falcon session hook currently prioritizes correctness and explicitness over deeper Better Auth integration features such as automatic session atom refresh behavior; if that behavior is needed later, reintroduce it only with explicit end-to-end verification

## Recommended Future Work

- add a dedicated end-to-end test for:
  - hosted sign-in
  - callback exchange
  - immediate signed-in landing state
  - starting a connection request
  - approving it in the target app
- add a small architecture note near the auth server or SDK code that explicitly states:
  - Falcon Auth session cookies are app-scoped
  - app-scoped requests require `X-Falcon-App-Id`
- consider adding a workspace-level developer note or script that rebuilds `packages/sdk` automatically when demo apps are being exercised locally

## Short Version

The core lesson is simple:

- Falcon Auth is app-aware, not just cookie-aware
- localhost cookie policy must differ from deployed HTTPS cookie policy
- callback success must be verified, not assumed
- any service that checks browser sessions on behalf of an app must forward both the cookie and the app id

Those four rules explain almost every failure that appeared during this fix cycle.
