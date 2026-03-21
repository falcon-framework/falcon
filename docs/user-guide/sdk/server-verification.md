# Server session verification

The **`verifySession`** helper (from **`@falcon-framework/sdk/server`**) lets your **backend** confirm that an incoming HTTP request belongs to a signed-in Falcon user by reusing the **same cookies** the browser would send to the auth server.

## API

```ts
import { verifySession } from "@falcon-framework/sdk/server";

const config = {
  serverUrl: "https://auth.example.com",
  publishableKey: "pk_live_abc123",
};

const session = await verifySession(config, incomingRequest);
```

**Parameters:**

- **`config.serverUrl`** — Falcon Auth base URL (no special path; the helper calls **`GET /api/auth/get-session`**).
- **`config.publishableKey`** — your app’s publishable key (forwarded as **`X-Falcon-App-Id`**).
- **`incomingRequest`** — a **`Request`**, or any object with **`headers`** (`Headers` or Node-style **`cookie`**).

**Returns:**

- **`null`** if there is no cookie, the auth server responds with an error, or the payload has no **user** / **session**.
- Otherwise **`VerifiedSession`** with **user** and **session** fields (dates may arrive as strings from JSON depending on runtime—parse if you need **`Date`** instances).

## How it works

1. Reads the **`Cookie`** header from the incoming request.
2. Forwards it to **`GET {serverUrl}/api/auth/get-session`** with **`X-Falcon-App-Id`**.
3. Parses the JSON body and validates presence of **user** and **session**.

No session secret is required in your API process: validation is delegated to the auth server.

## When to use it

- **BFF / API routes** that must not trust client-reported “logged in” flags alone.
- **Middleware** gating routes before hitting your databases.
- **Bridge services** that need a stable user id before calling internal APIs.

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

## Limitations

- Verifies **Falcon Auth session** only. Falcon Connect organization membership is separate (**`X-Organization-Id`**, Connect API checks).
- For **machine clients** without browser cookies, prefer **JWT** verification against JWKS or another server-to-server contract.

## Related topics

- [Auth callback and session](auth-callback-and-session.md)
- [Sessions and cookies](../falcon-auth/sessions-and-cookies.md)
- [Calling the Connect API](../falcon-connect/authentication.md)
