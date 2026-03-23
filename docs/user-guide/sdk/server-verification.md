# Server session verification and Connect token exchange

The **`@falcon-framework/sdk/server`** entry gives your **backend** two related helpers:

- **`verifySession`** — confirm that an incoming request or raw Falcon session token belongs to a signed-in Falcon user.
- **`mintFalconConnectAccessToken`** — exchange that Falcon session into a short-lived Connect Bearer token for backend / BFF Connect calls.

## API

```ts
import {
  mintFalconConnectAccessToken,
  verifySession,
} from "@falcon-framework/sdk/server";

const config = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};

const session = await verifySession(config, incomingRequest);
const access = await mintFalconConnectAccessToken(config, {
  organizationId: "org_123",
  incomingRequest,
});
```

**Parameters:**

- **`config.serverUrl`** — Falcon Auth base URL (no special path; the helper calls **`GET /api/auth/get-session`**).
- **`config.publishableKey`** — your app’s publishable key (forwarded as **`X-Falcon-App-Id`**).
- **`incomingRequest`** — a **`Request`**, or any object with **`headers`** (`Headers` or Node-style **`cookie`**).
- **`sessionToken`** — optional raw Falcon session token when your backend receives it explicitly instead of receiving Falcon cookies.
- **`organizationId`** — required when minting a Connect token.

**Returns:**

- **`null`** if there is no cookie, the auth server responds with an error, or the payload has no **user** / **session**.
- Otherwise **`VerifiedSession`** with **user** and **session** fields (dates may arrive as strings from JSON depending on runtime—parse if you need **`Date`** instances).

When the Falcon Auth server runs the **organization** plugin, the JSON may also include **`session.activeOrganizationId`** and optional **`activeOrganization`** / **`organizations`** on the root object. Those fields are preserved on **`VerifiedSession`** so your API can read active-org context without an extra round trip. Use **`FalconOrganizationSummary`** (exported from **`@falcon-framework/sdk`** and **`@falcon-framework/sdk/server`**) when typing those objects.

## How it works

1. Reads the **`Cookie`** header from the incoming request, or rebuilds the Falcon cookie from a provided raw session token.
2. Forwards it to **`GET {serverUrl}/api/auth/get-session`** with **`X-Falcon-App-Id`**.
3. Parses the JSON body and validates presence of **user** and **session**.
4. For Connect token exchange, posts **`organizationId`** to **`POST {serverUrl}/auth/connect/token`** and returns the short-lived access token.

No session secret is required in your API process: validation is delegated to the auth server.

## When to use it

- **BFF / API routes** that must not trust client-reported “logged in” flags alone.
- **Middleware** gating routes before hitting your databases.
- **Bridge services** that need a stable user id before calling internal APIs.
- **Cross-origin backend bridges** that receive a Falcon session token but cannot forward Falcon cookies directly to Connect.

## Examples

### Express

```ts
import express from "express";
import { verifySession } from "@falcon-framework/sdk/server";

const authConfig = {
  serverUrl: process.env.FALCON_AUTH_URL!,
  publishableKey: process.env.FALCON_PUBLISHABLE_KEY!,
};

const app = express();

app.get("/api/me", async (req, res) => {
  const session = await verifySession(authConfig, req);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: session.user });
});
```

### Hono

```ts
import { Hono } from "hono";
import { verifySession } from "@falcon-framework/sdk/server";

const app = new Hono();

app.use("*", async (c, next) => {
  const session = await verifySession(authConfig, c.req.raw);
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  c.set("falconUser", session.user);
  await next();
});
```

### Next.js (App Router, route handler)

```ts
import { verifySession } from "@falcon-framework/sdk/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const session = await verifySession(authConfig, {
    headers: { cookie: cookieHeader },
  });

  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ user: session.user });
}
```

Adjust cookie serialization if your deployment uses a different shape—the goal is to forward the **same** **`Cookie`** header the browser would send to the auth host.

## Example: raw Falcon session token -> Connect access token

```ts
import {
  mintFalconConnectAccessToken,
  verifySession,
} from "@falcon-framework/sdk/server";

const sessionToken = request.headers.get("x-falcon-session-token");

const session = await verifySession(authConfig, { sessionToken: sessionToken ?? undefined });
if (!session) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

const access = await mintFalconConnectAccessToken(authConfig, {
  organizationId: session.session.activeOrganizationId!,
  sessionToken: sessionToken ?? undefined,
});
```

## Limitations

- `verifySession` verifies **Falcon Auth session** only. Falcon Connect organization membership is separate (**`X-Organization-Id`**, Connect API checks).
- `mintFalconConnectAccessToken` mints a **user-bound**, **single-org**, **short-lived** token for Connect. It is not a long-lived offline delegation mechanism.

## Related topics

- [Auth callback and session](auth-callback-and-session.md)
- [Sessions and cookies](../falcon-auth/sessions-and-cookies.md)
- [Calling the Connect API](../falcon-connect/authentication.md)
