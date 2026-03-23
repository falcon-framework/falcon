# Connect Getting Started

This guide takes you from a basic Connect client to complete installation-request and connection-management flows. It covers the full `@falcon-framework/sdk/connect` surface and the related helpers in the root and server entries.

## 1. Understand the Connect model

Falcon Connect links one app to another for a specific organization.

Key concepts:

- **organization id**: the Better Auth organization id sent as `X-Organization-Id`
- **source app**: the app initiating an installation request
- **target app**: the app being connected to
- **installation request**: a pending request to connect two apps
- **connection**: the active relationship created after approval
- **capability / scope**: what the target app exposes and what the source app requests

Typical lifecycle:

1. source app discovers target capabilities
2. source app creates an installation request
3. target app lists pending requests
4. target app approves the request
5. both sides manage the resulting connection

## 2. Install and choose the right helpers

Install `zod` alongside the SDK when you import the Connect entry:

```sh
bun add @falcon-framework/sdk zod
```

Connect-related helpers live in three places:

- `@falcon-framework/sdk/connect`
  - `createFalconConnectClient`
  - schemas and types
  - HTTP error types
  - display helpers
- `@falcon-framework/sdk`
  - `buildFalconConnectHeaders`
- `@falcon-framework/sdk/server`
  - `mintFalconConnectAccessToken`

## 3. Create a browser Connect client

For browser apps that call Connect directly with Falcon Auth cookies:

```ts
import { createFalconConnectClient } from "@falcon-framework/sdk/connect";

const connect = createFalconConnectClient({
  baseUrl: "https://connect.example.com",
  organizationId: activeOrganizationId,
  publishableKey: "pk_live_abc123",
  credentials: "include",
});
```

Use this pattern when:

- the browser can send Falcon cookies to the Auth server path Connect relies on
- you already know the active organization id

### `buildFalconConnectHeaders`

If you make manual fetch calls instead of using the client, use:

```ts
import { buildFalconConnectHeaders } from "@falcon-framework/sdk";

const headers = buildFalconConnectHeaders({
  publishableKey: "pk_live_abc123",
  organizationId: activeOrganizationId,
});
```

## 4. Create a backend or BFF Connect client

For backends or BFFs, prefer a short-lived Connect access token.

```ts
import { mintFalconConnectAccessToken } from "@falcon-framework/sdk/server";
import { createFalconConnectClient } from "@falcon-framework/sdk/connect";

const access = await mintFalconConnectAccessToken(
  { serverUrl: authBase, publishableKey },
  {
    organizationId,
    incomingRequest: request,
  },
);

const connect = createFalconConnectClient({
  baseUrl: connectBase,
  organizationId,
  credentials: "omit",
  getAccessToken: () => access?.accessToken,
});
```

Use this pattern when:

- your backend does not have browser cookies at the Connect request hop
- you need a BFF or cross-origin bridge
- you want a stable, documented backend auth path

### Raw session token bridge

If your frontend sends the Falcon session token explicitly:

```ts
const access = await mintFalconConnectAccessToken(
  { serverUrl: authBase, publishableKey },
  {
    organizationId,
    sessionToken,
  },
);
```

## 5. Learn the client namespaces

The `FalconConnectClient` has four namespaces:

- `apps`
- `installationRequests`
- `connections`
- `scopes`

Each method returns validated data or throws a Connect error.

## 6. Discover apps and capabilities

### `apps.list()`

Returns registered Connect apps.

```ts
const apps = await connect.apps.list();
```

### `apps.capabilities(appId)`

Returns the scope keys the target app exposes.

```ts
const capabilities = await connect.apps.capabilities(targetAppId);
```

Use these methods to build app pickers or scope-selection UIs.

## 7. Start an installation request

### `installationRequests.create(body)`

Create a request from a source app to a target app:

```ts
const request = await connect.installationRequests.create({
  sourceAppId: "source-app-id",
  targetAppId: "target-app-id",
  requestedScopes: ["orders.read", "customers.read"],
  settingsDraft: {
    syncIntervalMinutes: 15,
  },
});
```

Input is validated by `createInstallationRequestBodySchema`.

### Typical source-app flow

1. call `apps.list()` or otherwise choose a target app
2. call `apps.capabilities(targetAppId)`
3. choose requested scopes
4. call `installationRequests.create(...)`
5. redirect the user into the target app’s approval UI

## 8. List and approve installation requests

### `installationRequests.list()`

Returns installation requests for the current org.

```ts
const requests = await connect.installationRequests.list();
const pending = requests.filter((req) => req.status === "pending");
```

### `installationRequests.approve(requestId)`

Approves a pending installation request and returns a connection summary.

```ts
const connection = await connect.installationRequests.approve(requestId);
```

### Typical target-app flow

1. call `installationRequests.list()`
2. show pending requests
3. call `installationRequests.approve(requestId)`
4. optionally call `connections.get(connection.id)` for a fuller detail view

## 9. Manage connections

### `connections.list()`

```ts
const connections = await connect.connections.list();
```

### `connections.get(connectionId)`

```ts
const detail = await connect.connections.get(connectionId);
```

### `connections.pause(connectionId)`

```ts
await connect.connections.pause(connectionId);
```

### `connections.resume(connectionId)`

```ts
await connect.connections.resume(connectionId);
```

### `connections.revoke(connectionId)`

```ts
await connect.connections.revoke(connectionId);
```

### `connections.sync(connectionId)`

```ts
const syncJob = await connect.connections.sync(connectionId);
```

These methods are useful for dashboards, admin pages, and operational tooling.

## 10. Check scopes defensively

### `scopes.check({ connectionId, appId, scope })`

```ts
const result = await connect.scopes.check({
  connectionId,
  appId: "target-app-id",
  scope: "orders.read",
});

if (!result.granted) {
  throw new Error("Scope not granted");
}
```

Use this for defense in depth before sensitive actions in your own backend or UI flows.

## 11. Use exported schemas and types

The Connect entry exports:

- request/response types such as:
  - `FalconConnectApp`
  - `FalconConnectCapability`
  - `FalconConnectInstallationRequest`
  - `FalconConnectConnection`
  - `FalconConnectConnectionDetail`
  - `FalconConnectSyncJob`
  - `FalconConnectCheckScopeBody`
  - `FalconConnectScopeCheckResult`
  - `FalconConnectCreateInstallationRequestBody`
- schemas such as:
  - `falconConnectAppSchema`
  - `falconConnectCapabilitySchema`
  - `falconConnectInstallationRequestSchema`
  - `falconConnectConnectionSchema`
  - `falconConnectConnectionDetailSchema`
  - `falconConnectSyncJobSchema`
  - `falconConnectAppsListSchema`
  - `falconConnectCapabilitiesListSchema`
  - `falconConnectConnectionsListSchema`
  - `falconConnectInstallationRequestsListSchema`
  - `createInstallationRequestBodySchema`
  - `checkScopeBodySchema`
  - `scopeCheckResultSchema`

Use them when you need extra validation, wrapper utilities, or app-specific transformations.

## 12. Use display helpers

The Connect entry also exports display-focused utilities:

- `buildFalconConnectAppMap`
- `falconConnectAppLabel`
- `displayFalconConnection`
- `resolveFalconConnectionsDisplay`
- `messageFromApiErrorBody`
- `FalconConnectAppDirectoryEntry`
- `FalconConnectConnectionSummaryInput`
- `FalconConnectAppMap`
- `FalconConnectConnectionDisplay`

### Example

```ts
import {
  resolveFalconConnectionsDisplay,
  createFalconConnectClient,
} from "@falcon-framework/sdk/connect";

const rows = await resolveFalconConnectionsDisplay(
  () => connect.apps.list(),
  () => connect.connections.list(),
);
```

Use these helpers when you want app labels and connection summaries without rebuilding the same mapping logic in every UI. `messageFromApiErrorBody` is useful when you are wrapping or normalizing Falcon Connect error responses yourself.

## 13. Understand the error model

Connect methods can throw:

- `FalconConnectHttpError`
- `FalconConnectNetworkError`
- `FalconConnectParseError`
- `FalconConnectValidationError`

### Typical handling

```ts
try {
  const connections = await connect.connections.list();
} catch (error) {
  if (error instanceof FalconConnectHttpError && error.status === 401) {
    // sign in again or fix org selection
  }
}
```

### Common status meanings

- `401`: user is not authenticated, token is invalid, or org header is wrong
- `403`: user lacks permission for the action
- `422`: the action is invalid for the current resource state

## 14. End-to-end walkthroughs

### Browser source app

1. resolve the active organization
2. create a browser Connect client with cookies
3. list apps or pick a target app
4. load target capabilities
5. create the installation request
6. redirect to the target app for approval

### Browser or backend target app

1. build a Connect client for the target org
2. list pending installation requests
3. approve the chosen request
4. load and display the resulting connection

### Backend bridge

1. verify the Falcon session or receive a Falcon session token
2. mint a short-lived Connect access token
3. build a backend Connect client with `getAccessToken`
4. call the desired Connect methods

## 15. Troubleshooting

### Connect returns 401 in the browser

Check:

- `credentials: "include"` is set
- `organizationId` is non-empty
- the publishable key matches the current app
- Falcon Auth cookies are actually usable in the current environment

### Connect returns 401 from a backend

Check:

- `mintFalconConnectAccessToken` succeeded
- the backend uses `credentials: "omit"` and `getAccessToken`
- the org passed to the token exchange matches `X-Organization-Id`

### Installation request creation fails

Check:

- source and target app ids are correct
- `requestedScopes` is non-empty
- the target app exposes those scopes
- the current user has the correct role in the org

### Approval fails

Check:

- the request is still pending
- the approver is in the same org
- the approver has owner/admin rights where required

### Validation errors appear unexpectedly

Check:

- the API and SDK versions are compatible
- your wrapper code is not reshaping the response before validation

## 16. Next step

If you still need the Falcon Auth browser, React, or server setup behind these Connect flows, go back to [Auth Getting Started](./auth-getting-started.md).
