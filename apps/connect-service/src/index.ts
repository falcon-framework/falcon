import { makeConnectionWebHandler } from "@falcon-framework/connection";
import { env } from "@falcon-framework/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

const { handler } = makeConnectionWebHandler(env.BETTER_AUTH_URL);

app.all("/v1/*", (c) => handler(c.req.raw));

app.get("/", (c) => c.text("OK"));

export default app;
