import { makeConnectionWebHandler } from "@falcon-framework/connection";
import { env } from "@falcon-framework/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

/** Comma-separated `CORS_ORIGIN` values (e.g. console + demo apps on different localhost ports). */
function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Allow the demo apps
      if (origin === "http://localhost:3010" || origin === "http://localhost:3011") {
        return origin;
      }
      if (!origin) return env.CORS_ORIGIN.split(",")[0]?.trim() ?? "";
      const allowed = parseCorsOrigins(env.CORS_ORIGIN);
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Organization-Id"],
    credentials: true,
  }),
);

const { handler } = makeConnectionWebHandler(env.BETTER_AUTH_URL);

app.all("/v1/*", async (c) => handler(c.req.raw));

app.get("/", (c) => c.text("OK"));

export default app;
