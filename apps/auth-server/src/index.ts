import { createContext } from "@falcon-framework/api/context";
import { appRouter } from "@falcon-framework/api/routers/index";
import { auth, resolveAuthApp } from "@falcon-framework/auth";
import { makeDb } from "@falcon-framework/db";
import { appUser, falconAuthApp } from "@falcon-framework/db/schema/auth-app";
import { env } from "@falcon-framework/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

/**
 * Dynamic CORS middleware.
 *
 * 1. If the request Origin matches env.CORS_ORIGIN (the console app), allow immediately.
 * 2. Otherwise, read the X-Falcon-App-Id header (the publishable key).
 * 3. Look up the falcon_auth_app by publishable key and check its allowed origins.
 */
app.use(
  "/*",
  cors({
    origin: async (origin, c) => {
      // Allow the demo apps
      if (origin === "http://localhost:3010" || origin === "http://localhost:3011") {
        return origin;
      }
      // Console app is always allowed
      if (origin === env.CORS_ORIGIN) {
        return origin;
      }

      // Check for an external app's publishable key
      const appId = c.req.header("X-Falcon-App-Id");
      if (appId && origin) {
        try {
          const authApp = await resolveAuthApp(appId);
          if (authApp && authApp.allowedOrigins.includes(origin)) {
            return origin;
          }
        } catch (e) {
          console.error("Failed to resolve auth app for CORS:", e);
        }
      }

      return env.CORS_ORIGIN;
    },
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Falcon-App-Id"],
    credentials: true,
  }),
);

/**
 * Auth routes — app-aware.
 *
 * When X-Falcon-App-Id is present, the Better-Auth instance is configured
 * with that app's trusted origins and database hooks for linking users to apps.
 */
app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const appId = c.req.header("X-Falcon-App-Id");
  let extraTrustedOrigins: string[] | undefined;

  if (appId) {
    try {
      const authApp = await resolveAuthApp(appId);
      if (authApp) {
        extraTrustedOrigins = authApp.allowedOrigins;
      }
    } catch (e) {
      console.error("Failed to resolve auth app:", e);
    }
  }

  return auth({ appId, extraTrustedOrigins }).handler(c.req.raw);
});

/**
 * User apps routes — list and revoke auth app access for the current user.
 * Requires a valid session cookie (console app user).
 */
app.get("/api/user/apps", async (c) => {
  const session = await auth().api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const db = makeDb();
  const rows = await db
    .select({
      appId: falconAuthApp.id,
      name: falconAuthApp.name,
      connectedAt: appUser.createdAt,
    })
    .from(appUser)
    .innerJoin(falconAuthApp, eq(appUser.appId, falconAuthApp.id))
    .where(eq(appUser.userId, session.user.id));

  return c.json(rows);
});

app.delete("/api/user/apps/:appId", async (c) => {
  const session = await auth().api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { appId } = c.req.param();
  const db = makeDb();
  await db
    .delete(appUser)
    .where(and(eq(appUser.appId, appId), eq(appUser.userId, session.user.id)));

  return c.body(null, 204);
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
