# Falcon Connect HTTP client

The **`@falcon-framework/sdk/connect`** entry exports **`createFalconConnectClient`**: a small **fetch**-based client for **Connect API v1** (`/v1/*`). Responses are validated at runtime with **Zod** so types and JSON stay aligned. For **pure** UI helpers (labels, connection lines), see [Connect display helpers](connect-helpers.md).

## Installation

The SDK lists **`zod`** as a runtime dependency; you do not need to add Zod yourself unless you want to compose the exported schemas.

```sh
bun add @falcon-framework/sdk
```

## Creating a client

```ts
import { createFalconConnectClient } from "@falcon-framework/sdk/connect";

const connect = createFalconConnectClient({
  /** Connect base URL without `/v1` */
  baseUrl: import.meta.env.VITE_CONNECT_URL,
  /** Better Auth organization id (same as active org in the UI) */
  organizationId: activeOrganizationId,
  /**
   * Recommended for browser apps using session cookies: forwarded as `X-Falcon-App-Id`
   * when resolving the session against Falcon Auth.
   */
  publishableKey: import.meta.env.VITE_FALCON_PUBLISHABLE_KEY,
  /** Default `"include"` — required for cookie sessions to Connect */
  credentials: "include",
});
```

### Server or JWT-only callers

Set **`getAccessToken`** to return a Bearer token verified by Connect (see [Calling the Connect API](../falcon-connect/authentication.md)). You can omit **`publishableKey`** when not using the cookie + get-session path.

```ts
const connect = createFalconConnectClient({
  baseUrl: process.env.CONNECT_URL!,
  organizationId: orgId,
  credentials: "omit",
  getAccessToken: () => process.env.FALCON_ACCESS_TOKEN,
});
```

Optional **`getHeaders`** merges extra headers on every request. Optional **`fetch`** overrides the global (tests, edge runtimes).

## API surface

All methods return **Promises** of **validated** data (or throw — see [Errors](#errors)).

| Namespace | Methods |
|-----------|---------|
| **`apps`** | **`list()`**, **`capabilities(appId)`** |
| **`installationRequests`** | **`list()`**, **`create(body)`**, **`approve(requestId)`** |
| **`connections`** | **`list()`**, **`get(connectionId)`**, **`revoke`**, **`pause`**, **`resume`**, **`sync`** |
| **`scopes`** | **`check({ connectionId, appId, scope })`** |

`create` validates the body with Zod before sending. Invalid input throws **`z.ZodError`** (same as **`createInstallationRequestBodySchema.parse`**).

## Recipes

### Source app (start an install)

1. Resolve the target app (catalog, env, or **`apps.list()`**).
2. Optional: **`apps.capabilities(targetAppId)`** to show allowed scope keys.
3. **`installationRequests.create({ sourceAppId, targetAppId, requestedScopes, settingsDraft? })`**.
4. Redirect the browser to your target app’s approval UI (return URL, request id) — see [Installation requests and approval](../falcon-connect/installation-and-approval.md).

### Target app (inbox + approve)

1. **`installationRequests.list()`** and surface **`status === "pending"`** rows for the current org.
2. **`installationRequests.approve(requestId)`** — returns a **connection** summary (HTTP 201).
3. Optional: **`connections.get(connectionId)`** for scopes and settings.

### Ongoing management

1. **`connections.list()`** / **`get`** for dashboards and detail pages.
2. **`pause`**, **`resume`**, **`revoke`**, **`sync`** for lifecycle actions (roles apply — see [Permissions matrix](../reference/permissions-matrix.md)).
3. **`scopes.check`** for defense in depth before performing a sensitive action in your own API.

### Combining with display helpers

```ts
import {
  createFalconConnectClient,
  resolveFalconConnectionsDisplay,
} from "@falcon-framework/sdk/connect";

const client = createFalconConnectClient({ /* … */ });

const rows = await resolveFalconConnectionsDisplay(
  () => client.apps.list(),
  () => client.connections.list(),
);
```

## Errors

| Class | Meaning |
|-------|---------|
| **`FalconConnectHttpError`** | Non-2xx response. **`status`**, **`message`**, **`body`**. Message is taken from **`message`**, **`error`**, or the status line when JSON is missing. |
| **`FalconConnectValidationError`** | 2xx response but JSON **does not match** the expected Zod schema (server drift or unexpected payload). Inspect **`issues`** / **`zodError`**. |
| **`FalconConnectParseError`** | 2xx but body is empty or not JSON. |
| **`FalconConnectNetworkError`** | **`fetch`** failed (offline, CORS, etc.). **`cause`** preserved. |

**Guidance:** treat **401** as “sign in or pick an org”; **403** as permission; **422** as invalid state for the operation. Retry only **idempotent GETs** on transient failures.

## Exported schemas

Advanced integrations can import Zod schemas and types (for example **`falconConnectAppSchema`**, **`falconConnectConnectionDetailSchema`**, **`createInstallationRequestBodySchema`**) from **`@falcon-framework/sdk/connect`** to extend or wrap validation.

## Related topics

- [Calling the Connect API](../falcon-connect/authentication.md)
- [Managing connections](../falcon-connect/managing-connections.md)
- [Connect display helpers](connect-helpers.md)
- [`buildFalconConnectHeaders`](../sdk/organizations.md) on the main SDK entry
