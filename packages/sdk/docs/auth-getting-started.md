# Auth Getting Started

This guide takes you from a fresh install to a complete Falcon Auth integration. It covers the full SDK Auth surface:

- core browser helpers from `@falcon-framework/sdk`
- React provider, hooks, and prebuilt components from `@falcon-framework/sdk/react`
- server helpers from `@falcon-framework/sdk/server`
- organization helpers and active-organization patterns

The examples are framework-neutral first. React-specific sections come later.

## 1. Install and choose entry points

Install the SDK and the peers you actually use:

```sh
bun add @falcon-framework/sdk better-auth
```

Add these only when needed:

- `react` and `react-dom` if you use `@falcon-framework/sdk/react`
- `zod` if you use `@falcon-framework/sdk/connect`

The SDK is split into four entry points:

- `@falcon-framework/sdk` for browser Auth helpers and shared core types
- `@falcon-framework/sdk/react` for provider, hooks, and components
- `@falcon-framework/sdk/server` for backend session verification and Connect token exchange
- `@falcon-framework/sdk/connect` for the Connect HTTP client and display helpers

## 2. Gather the values your app needs

Every Auth integration starts with a Falcon Auth base URL and your app’s publishable key:

```ts
const config = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};
```

You can build a configured client up front with `createFalconAuth(config)`:

```ts
import { createFalconAuth } from "@falcon-framework/sdk";

const falconAuth = createFalconAuth(config);
```

That client wraps Better Auth’s React client and automatically injects `X-Falcon-App-Id`.

These values are used by:

- `createFalconAuth`
- `buildSignInUrl` and `buildSignUpUrl`
- `exchangeCodeForSession`
- `fetchFalconSession`
- `signOutFalconSession`
- `verifySession`
- `mintFalconConnectAccessToken`

## 3. Start with hosted sign-in and sign-up

The simplest browser flow is the hosted Falcon Auth flow.

### Build sign-in and sign-up URLs

Use:

- `buildSignInUrl(config, options)`
- `buildSignUpUrl(config, options)`

or the navigation helpers:

- `redirectToSignIn(config, options)`
- `redirectToSignUp(config, options)`

Example:

```ts
import { buildSignInUrl } from "@falcon-framework/sdk";

const state = crypto.randomUUID();
sessionStorage.setItem("falcon_auth_state", state);

const signInUrl = buildSignInUrl(config, {
  redirectUri: `${window.location.origin}/auth/callback`,
  state,
});

window.location.href = signInUrl.toString();
```

### What these helpers do

- attach `client_id` from your publishable key
- attach your `redirect_uri`
- pass through `state` for CSRF protection

### Common mistakes

- forgetting to store and verify `state`
- using a `redirect_uri` that is not allow-listed by Falcon Auth
- using the wrong publishable key for the current app

## 4. Finish the callback flow

After hosted sign-in, your app gets redirected back with query parameters such as `code` and `state`.

### Minimal manual flow

Use:

- `exchangeCodeForSession`
- `fetchFalconSession`

```ts
import { exchangeCodeForSession, fetchFalconSession } from "@falcon-framework/sdk";

await exchangeCodeForSession(config, { code });
const session = await fetchFalconSession(config);
```

### Recommended flow

Use `completeAuthCallback` to bundle the standard sequence:

1. validate `state`
2. exchange the `code`
3. poll session visibility until Falcon Auth reports a real session

```ts
import {
  completeAuthCallback,
  exchangeCodeForSession,
  fetchFalconSession,
} from "@falcon-framework/sdk";

await completeAuthCallback({
  code,
  state,
  storedState: sessionStorage.getItem("falcon_auth_state"),
  exchangeCode: (authCode) => exchangeCodeForSession(config, { code: authCode }),
  getSession: async () => ({ data: await fetchFalconSession(config) }),
});
```

### Related types

- `ExchangeCodeOptions`
- `ExchangeCodeResult`
- `CompleteAuthCallbackOptions`
- `SessionLookupResult`

## 5. Read the browser session and sign out

Use:

- `fetchFalconSession(config)`
- `signOutFalconSession(config)`

```ts
import { fetchFalconSession, signOutFalconSession } from "@falcon-framework/sdk";

const session = await fetchFalconSession(config);
if (session?.user) {
  console.log(session.user.email);
}

await signOutFalconSession(config);
```

Important session-related types from the root entry:

- `FalconAuthConfig`
- `FalconAuthState`
- `FalconUser`
- `FalconSession`
- `FalconSessionResponse`
- `FalconOrganizationSummary`
- `FalconAuthClient`

## 6. Understand session cookies and headers

Falcon Auth uses app-scoped session cookies on the Auth origin.

### `sessionCookieName`

Use `sessionCookieName(publishableKey)` when you need the concrete cookie name for:

- debugging
- bridging a raw Falcon session token into a backend request
- custom server-side parsing

### `buildFalconConnectHeaders`

Use `buildFalconConnectHeaders({ publishableKey, organizationId, init? })` when preparing Connect requests that need:

- `X-Falcon-App-Id`
- `X-Organization-Id`

That helper is primarily about Connect, but it belongs to the root entry because Auth and organization context often feed those headers.

## 7. Add React integration

If your app uses React, the `@falcon-framework/sdk/react` entry gives you a provider, hooks, and prebuilt components.

### Wrap your app

```tsx
import { FalconAuthProvider } from "@falcon-framework/sdk/react";

<FalconAuthProvider config={config}>
  <App />
</FalconAuthProvider>;
```

### Use hooks

The React entry exports:

- `useFalconAuth`
- `useFalconAuthContextOptional`
- `useUser`
- `useSession`

Example:

```tsx
import { useFalconAuth, useUser, useSession } from "@falcon-framework/sdk/react";

function AccountPanel() {
  const { isLoaded, isSignedIn, client } = useFalconAuth();
  const { user } = useUser();
  const { session } = useSession();

  if (!isLoaded) return <p>Loading…</p>;
  if (!isSignedIn) return <p>Signed out</p>;

  return (
    <div>
      <p>{user?.email}</p>
      <p>{session?.activeOrganizationId}</p>
      <button onClick={() => client.signOut()}>Sign out</button>
    </div>
  );
}
```

### Use prebuilt UI components

The React entry exports:

- `SignIn`
- `SignUp`
- `UserButton`

These are useful when you want a standard Falcon Auth UI without building each control yourself.

## 8. Add organizations and active organization state

Falcon Connect and many org-scoped product flows depend on a current organization.

### Low-level organization access

The root entry re-exports `organizationClient` from Better Auth’s organization plugin.

### React organization helpers

The React entry exports:

- `useOrganizations`
- `ActiveOrganizationProvider`
- `useActiveOrganization`
- `OrganizationSwitcher`

#### `useOrganizations`

Use it to:

- list organizations
- create organizations
- set the active organization

```tsx
import { useOrganizations } from "@falcon-framework/sdk/react";

function CreateOrgButton() {
  const organizations = useOrganizations();

  return (
    <button
      onClick={async () => {
        const created = await organizations.create({
          name: "Acme",
          slug: "acme",
        });
        if (created?.id) {
          await organizations.setActive({ organizationId: created.id });
        }
      }}
    >
      Create organization
    </button>
  );
}
```

#### `ActiveOrganizationProvider` and `useActiveOrganization`

Use these when the rest of your UI needs a stable, resolved “current org” value.

Relevant React types exported by the package include:

- `FalconAuthProviderProps`
- `UseOrganizationsResult`
- `ActiveOrganizationProviderProps`
- `ActiveOrganizationContextValue`
- `FalconActiveOrganizationItem`
- `SignInProps`
- `SignUpProps`
- `UserButtonProps`
- `OrganizationSwitcherProps`

#### `OrganizationSwitcher`

Use this when you want a ready-made org picker UI.

### Common mistakes

- treating `session.activeOrganizationId` as guaranteed even when the user has not selected an org
- calling Connect without an org header
- assuming the browser active org and backend active org are automatically synchronized

## 9. Add server-side session verification

For backend routes, middleware, or BFF patterns, use `@falcon-framework/sdk/server`.

### `verifySession`

Use `verifySession(config, input)` to validate:

- a normal incoming request with Falcon cookies
- a `{ headers }` object
- a raw Falcon `sessionToken`

```ts
import { verifySession } from "@falcon-framework/sdk/server";

const verified = await verifySession(config, request);
if (!verified) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
```

This returns `VerifiedSession | null`.

### Raw session token handling

If your frontend sends a Falcon session token to your backend explicitly, you can verify it directly:

```ts
const verified = await verifySession(config, {
  sessionToken,
});
```

This is useful for cross-origin BFF integrations where the backend does not receive Falcon cookies directly.

## 10. Mint backend Connect access tokens

Use `mintFalconConnectAccessToken` when your backend needs to call Falcon Connect as the currently authenticated user without relying on browser cookies at the Connect hop.

```ts
import { mintFalconConnectAccessToken } from "@falcon-framework/sdk/server";

const access = await mintFalconConnectAccessToken(config, {
  organizationId: "org_123",
  incomingRequest: request,
});
```

or with a raw session token:

```ts
const access = await mintFalconConnectAccessToken(config, {
  organizationId: "org_123",
  sessionToken,
});
```

Key server exports:

- `VerifySessionConfig`
- `VerifiedSession`
- `MintFalconConnectAccessTokenOptions`
- `FalconConnectAccessTokenResult`
- `FalconServerAuthInput`
- `IncomingServerRequest`

## 11. Type exports you will see across integrations

The root and React entries also export shared types that are useful when you want explicit typing around session and Auth state:

- `FalconAuthClient`
- `FalconAuthConfig`
- `FalconAuthState`
- `FalconUser`
- `FalconSession`
- `FalconSessionResponse`
- `FalconOrganizationSummary`
- `RedirectToSignInOptions`
- `ExchangeCodeOptions`
- `ExchangeCodeResult`
- `CompleteAuthCallbackOptions`
- `SessionLookupResult`

## 12. Recommended end-to-end integration path

For most applications:

1. install the SDK
2. configure `serverUrl` and `publishableKey`
3. start with hosted sign-in URLs
4. complete the callback with `completeAuthCallback`
5. read the browser session with `fetchFalconSession` or React hooks
6. add organization creation / switching if the app is org-scoped
7. protect backend routes with `verifySession`
8. if the backend calls Connect, use `mintFalconConnectAccessToken`

## 13. Troubleshooting

### The callback succeeds but the user still looks signed out

Check:

- `redirect_uri` matches the Auth app allow-list
- `exchangeCodeForSession` actually runs
- `fetchFalconSession` is called with the correct `serverUrl`
- browser credentials are not blocked by local dev or deployment config

### React hooks never show a loaded signed-in state

Check:

- `FalconAuthProvider` wraps the component tree
- the provider `config` matches the correct app
- the callback route completed successfully

### Backend verification fails even though the user is signed in in the browser

Check:

- whether the backend actually receives Falcon cookies
- whether you need to send a raw Falcon session token and call `verifySession({ sessionToken })`
- whether the publishable key matches the app the user signed into

### Organization-aware UI breaks

Check:

- the user actually belongs to an organization
- active organization selection is happening after org creation
- Connect requests include the same org id the user selected

## 14. Next step

If your app needs Falcon Connect, continue with [Connect Getting Started](./connect-getting-started.md).
