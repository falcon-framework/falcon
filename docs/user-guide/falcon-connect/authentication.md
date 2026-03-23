# Calling the Connect API

All Connect endpoints are scoped to an **organization** and require a known **authenticated user** with **membership** in that organization.

## Required header: `X-Organization-Id`

Every request must include:

```http
X-Organization-Id: <better-auth-organization-id>
```

The value must be the **organization id** from Better Auth’s organization plugin (the same id the console uses as “active org”).

If this header is missing or empty, the service responds with **401** rather than guessing an organization. This avoids accidental data leaks from “first membership wins” behavior.

## How the Connect service authenticates the user

The Connect runtime resolves a **principal**:

1. **Session cookie** — If the `Cookie` header is present, Connect proxies to the auth server’s **`/api/auth/get-session`** using those cookies. If a user is returned, Connect loads **`member`** for `(userId, organizationId)`.
2. **Bearer JWT** — If `Authorization: Bearer …` is present, Connect verifies the token using the auth server’s **JWKS** (`/.well-known/jwks.json`) and expects:
   - **`sub`** = Falcon user id
   - **`org_id`** = requested Better Auth organization id
   - **`app_id`** = Falcon app / publishable key identity
   - **`aud`** = `falcon-connect`
   - standard **`iss`**, **`iat`**, **`exp`**

The JWT path is the recommended pattern for **BFF**, **server**, and **backend** callers that cannot rely on browser cookies being present on the Connect request.

If neither strategy yields a valid user bound to the requested organization, the request is **unauthorized**.

## CORS and credentials

Browser apps must call Connect with **`credentials: 'include'`** when using cookie-based sessions, and the Connect service must allow your origin via its **CORS** configuration (often a comma-separated allow list including console and app URLs).

## Roles after authentication

Once the principal is known, Connect checks **role** strings (`owner`, `admin`, `member`) before allowing sensitive mutations. See [Permissions matrix](../reference/permissions-matrix.md).

## Example: fetch from a browser

```ts
const res = await fetch(`${connectBase}/v1/connections`, {
  credentials: "include",
  headers: {
    "X-Organization-Id": activeOrganizationId,
  },
});
```

## Example: browser app with cookies

```ts
const connect = createFalconConnectClient({
  baseUrl: connectBase,
  organizationId: activeOrganizationId,
  publishableKey: falconPublishableKey,
  credentials: "include",
});
```

## Example: backend / BFF with short-lived Connect token

The auth server exposes **`POST /auth/connect/token`** for exchanging a Falcon session into a short-lived Connect access token. The SDK server entry wraps that flow with **`mintFalconConnectAccessToken`**.

```ts
import { mintFalconConnectAccessToken } from "@falcon-framework/sdk/server";
import { createFalconConnectClient } from "@falcon-framework/sdk/connect";

const access = await mintFalconConnectAccessToken(
  { serverUrl: authBase, publishableKey },
  {
    organizationId,
    sessionToken,
  },
);

const connect = createFalconConnectClient({
  baseUrl: connectBase,
  organizationId,
  credentials: "omit",
  getAccessToken: () => access?.accessToken,
});
```

## Example: server-to-server / backend guidance

Prefer the Auth-issued short-lived Connect JWT for user-bound backend work. Introduce a separate service-account or offline delegation pattern only when the work is not tied to a live Falcon user session.

## Reliability note

The implementation may **retry once** when cookies and organization are present to smooth rare races between session establishment and membership reads. Clients should still treat **401** as “user must sign in or pick an org.”

## Related topics

- [Architecture](../getting-started/architecture.md)
- [Server session verification](../sdk/server-verification.md)
- [Organizations](../falcon-auth/organizations.md)
