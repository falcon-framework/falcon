import { createContext } from "@falcon-framework/api/context";
import { appRouter } from "@falcon-framework/api/routers/index";
import { auth, resolveAuthApp } from "@falcon-framework/auth";
import { makeDb } from "@falcon-framework/db";
import { appUser, authorizationCode, falconAuthApp } from "@falcon-framework/db/schema/auth-app";
import { env } from "@falcon-framework/env/server";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { and, eq, gt, isNull } from "drizzle-orm";
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

// ---------------------------------------------------------------------------
// OAuth-like redirect flow helpers
// ---------------------------------------------------------------------------

const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Extract the Set-Cookie header's session token value from a Better-Auth response. */
function extractSessionToken(response: Response): string | null {
  const raw = response.headers.get("set-cookie") ?? "";
  // Better-Auth sets: better-auth.session_token=<value>; Path=/; ...
  const match = raw.match(/better-auth\.session_token=([^;]+)/);
  return match?.[1] ?? null;
}

/** Shared CSS for auth pages — minimal, consistent with the Falcon teal palette. */
const PAGE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f0fafa;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #173a40;
  }
  .card {
    background: #fff;
    border: 1px solid #c8e8eb;
    border-radius: 16px;
    padding: 2rem;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 2px 12px rgba(23,58,64,0.07);
  }
  .brand { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #4fb8b2; margin-bottom: 0.5rem; }
  h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; }
  .subtitle { font-size: 0.85rem; color: #5a8a91; margin-bottom: 1.5rem; }
  label { display: block; font-size: 0.82rem; font-weight: 500; margin-bottom: 0.35rem; }
  input[type=email], input[type=password], input[type=text] {
    width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #c8e8eb;
    border-radius: 8px; font-size: 0.9rem; outline: none; transition: border-color 0.15s;
    margin-bottom: 1rem; background: #f9fefe;
  }
  input:focus { border-color: #4fb8b2; box-shadow: 0 0 0 3px rgba(79,184,178,0.15); }
  .btn {
    width: 100%; padding: 0.6rem; background: #4fb8b2; color: #fff;
    border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
    cursor: pointer; transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.9; }
  .error {
    background: #fff0f0; border: 1px solid #f5c6c6; border-radius: 8px;
    padding: 0.5rem 0.75rem; font-size: 0.82rem; color: #b94a4a; margin-bottom: 1rem;
  }
  .switch { margin-top: 1.25rem; border-top: 1px solid #e8f4f5; padding-top: 1rem; text-align: center; font-size: 0.82rem; color: #5a8a91; }
  .switch a { color: #328f97; text-decoration: underline; }
`;

function renderSignInPage(opts: {
  appName: string;
  clientId: string;
  redirectUri: string;
  state: string;
  error?: string;
}): string {
  const { appName, clientId, redirectUri, state, error } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in — Falcon Auth</title>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <div class="card">
    <p class="brand">Falcon Auth</p>
    <h1>Sign in to ${escapeHtml(appName)}</h1>
    <p class="subtitle">Enter your credentials to continue</p>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <form method="POST" action="/auth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="state" value="${escapeHtml(state)}" />
      <label for="email">Email</label>
      <input id="email" type="email" name="email" required placeholder="you@example.com" />
      <label for="password">Password</label>
      <input id="password" type="password" name="password" required placeholder="••••••••" />
      <button class="btn" type="submit">Sign in</button>
    </form>
    <div class="switch">
      Don't have an account?
      <a href="/auth/sign-up?client_id=${encodeURIComponent(clientId)}&amp;redirect_uri=${encodeURIComponent(redirectUri)}&amp;state=${encodeURIComponent(state)}">Create one</a>
    </div>
  </div>
</body>
</html>`;
}

function renderSignUpPage(opts: {
  appName: string;
  clientId: string;
  redirectUri: string;
  state: string;
  error?: string;
}): string {
  const { appName, clientId, redirectUri, state, error } = opts;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Create account — Falcon Auth</title>
  <style>${PAGE_CSS}</style>
</head>
<body>
  <div class="card">
    <p class="brand">Falcon Auth</p>
    <h1>Create account</h1>
    <p class="subtitle">Sign up to use ${escapeHtml(appName)}</p>
    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}
    <form method="POST" action="/auth/sign-up">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}" />
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}" />
      <input type="hidden" name="state" value="${escapeHtml(state)}" />
      <label for="name">Full name</label>
      <input id="name" type="text" name="name" required placeholder="Your name" />
      <label for="email">Email</label>
      <input id="email" type="email" name="email" required placeholder="you@example.com" />
      <label for="password">Password</label>
      <input id="password" type="password" name="password" required placeholder="••••••••" />
      <button class="btn" type="submit">Create account</button>
    </form>
    <div class="switch">
      Already have an account?
      <a href="/auth/authorize?client_id=${encodeURIComponent(clientId)}&amp;redirect_uri=${encodeURIComponent(redirectUri)}&amp;state=${encodeURIComponent(state)}">Sign in</a>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate that the redirect_uri is registered for the given app.
 * Returns the resolved app or null if client_id / redirect_uri is invalid.
 */
async function validateAuthRequest(
  clientId: string | undefined,
  redirectUri: string | undefined,
): Promise<{ id: string; name: string; allowedOrigins: string[]; redirectUrls: string[] } | null> {
  if (!clientId || !redirectUri) return null;
  const authApp = await resolveAuthApp(clientId);
  if (!authApp) return null;
  if (!authApp.redirectUrls.includes(redirectUri)) return null;
  return authApp;
}

// ---------------------------------------------------------------------------
// Authorization endpoint — GET: show sign-in form
// ---------------------------------------------------------------------------
app.get("/auth/authorize", async (c) => {
  const { client_id, redirect_uri, state = "" } = c.req.query();
  const authApp = await validateAuthRequest(client_id, redirect_uri);
  if (!authApp) {
    return c.html(
      `<p style="font-family:sans-serif;padding:2rem">Invalid <code>client_id</code> or <code>redirect_uri</code>.</p>`,
      400,
    );
  }
  return c.html(
    renderSignInPage({ appName: authApp.name, clientId: client_id!, redirectUri: redirect_uri!, state }),
  );
});

// ---------------------------------------------------------------------------
// Authorization endpoint — POST: process sign-in
// ---------------------------------------------------------------------------
app.post("/auth/authorize", async (c) => {
  const body = await c.req.parseBody();
  const clientId = String(body["client_id"] ?? "");
  const redirectUri = String(body["redirect_uri"] ?? "");
  const state = String(body["state"] ?? "");
  const email = String(body["email"] ?? "");
  const password = String(body["password"] ?? "");

  const authApp = await validateAuthRequest(clientId, redirectUri);
  if (!authApp) {
    return c.html(
      `<p style="font-family:sans-serif;padding:2rem">Invalid <code>client_id</code> or <code>redirect_uri</code>.</p>`,
      400,
    );
  }

  const authInstance = auth({ appId: clientId, extraTrustedOrigins: authApp.allowedOrigins });
  const signInResponse = await authInstance.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  if (!signInResponse.ok) {
    return c.html(
      renderSignInPage({
        appName: authApp.name,
        clientId,
        redirectUri,
        state,
        error: "Invalid email or password. Please try again.",
      }),
    );
  }

  const sessionToken = extractSessionToken(signInResponse);
  if (!sessionToken) {
    return c.html(
      renderSignInPage({
        appName: authApp.name,
        clientId,
        redirectUri,
        state,
        error: "Sign-in succeeded but no session was created. Please try again.",
      }),
    );
  }

  const code = crypto.randomUUID();
  const db = makeDb();
  await db.insert(authorizationCode).values({
    id: crypto.randomUUID(),
    code,
    appId: authApp.id,
    sessionToken,
    redirectUri,
    state: state || null,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
  });

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", code);
  if (state) callbackUrl.searchParams.set("state", state);
  return c.redirect(callbackUrl.toString());
});

// ---------------------------------------------------------------------------
// Sign-up endpoint — GET: show sign-up form
// ---------------------------------------------------------------------------
app.get("/auth/sign-up", async (c) => {
  const { client_id, redirect_uri, state = "" } = c.req.query();
  const authApp = await validateAuthRequest(client_id, redirect_uri);
  if (!authApp) {
    return c.html(
      `<p style="font-family:sans-serif;padding:2rem">Invalid <code>client_id</code> or <code>redirect_uri</code>.</p>`,
      400,
    );
  }
  return c.html(
    renderSignUpPage({ appName: authApp.name, clientId: client_id!, redirectUri: redirect_uri!, state }),
  );
});

// ---------------------------------------------------------------------------
// Sign-up endpoint — POST: process registration
// ---------------------------------------------------------------------------
app.post("/auth/sign-up", async (c) => {
  const body = await c.req.parseBody();
  const clientId = String(body["client_id"] ?? "");
  const redirectUri = String(body["redirect_uri"] ?? "");
  const state = String(body["state"] ?? "");
  const name = String(body["name"] ?? "");
  const email = String(body["email"] ?? "");
  const password = String(body["password"] ?? "");

  const authApp = await validateAuthRequest(clientId, redirectUri);
  if (!authApp) {
    return c.html(
      `<p style="font-family:sans-serif;padding:2rem">Invalid <code>client_id</code> or <code>redirect_uri</code>.</p>`,
      400,
    );
  }

  const authInstance = auth({ appId: clientId, extraTrustedOrigins: authApp.allowedOrigins });
  const signUpResponse = await authInstance.api.signUpEmail({
    body: { name, email, password },
    asResponse: true,
  });

  if (!signUpResponse.ok) {
    let errorMessage = "Registration failed. The email may already be in use.";
    try {
      const errData = (await signUpResponse.json()) as { message?: string };
      if (errData.message) errorMessage = errData.message;
    } catch {
      // ignore
    }
    return c.html(
      renderSignUpPage({ appName: authApp.name, clientId, redirectUri, state, error: errorMessage }),
    );
  }

  const sessionToken = extractSessionToken(signUpResponse);
  if (!sessionToken) {
    return c.html(
      renderSignUpPage({
        appName: authApp.name,
        clientId,
        redirectUri,
        state,
        error: "Account created but sign-in failed. Please sign in manually.",
      }),
    );
  }

  const code = crypto.randomUUID();
  const db = makeDb();
  await db.insert(authorizationCode).values({
    id: crypto.randomUUID(),
    code,
    appId: authApp.id,
    sessionToken,
    redirectUri,
    state: state || null,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
  });

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("code", code);
  if (state) callbackUrl.searchParams.set("state", state);
  return c.redirect(callbackUrl.toString());
});

// ---------------------------------------------------------------------------
// Token endpoint — POST: exchange authorization code for session token
// ---------------------------------------------------------------------------
app.post("/auth/token", async (c) => {
  let body: { code?: string; client_id?: string };
  try {
    body = (await c.req.json()) as { code?: string; client_id?: string };
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { code, client_id } = body;
  if (!code || !client_id) {
    return c.json({ error: "Missing code or client_id" }, 400);
  }

  const authApp = await resolveAuthApp(client_id);
  if (!authApp) {
    return c.json({ error: "Unknown client_id" }, 400);
  }

  const db = makeDb();
  const rows = await db
    .select()
    .from(authorizationCode)
    .where(
      and(
        eq(authorizationCode.code, code),
        eq(authorizationCode.appId, authApp.id),
        gt(authorizationCode.expiresAt, new Date()),
        isNull(authorizationCode.usedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    return c.json({ error: "Invalid, expired, or already-used code" }, 400);
  }

  // Mark the code as used (single-use)
  await db
    .update(authorizationCode)
    .set({ usedAt: new Date() })
    .where(eq(authorizationCode.id, row.id));

  return c.json({ sessionToken: row.sessionToken });
});

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
