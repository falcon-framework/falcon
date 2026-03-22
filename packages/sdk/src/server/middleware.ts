import type { FalconOrganizationSummary } from "../core/types";

export interface VerifySessionConfig {
  /** The URL of the Falcon auth server */
  serverUrl: string;
  /** The publishable key for your app */
  publishableKey: string;
}

export interface VerifiedSession {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    activeOrganizationId?: string | null;
  };
  /** When the auth server includes organization plugin fields on get-session. */
  activeOrganization?: FalconOrganizationSummary | null;
  organizations?: FalconOrganizationSummary[];
}

/**
 * Verifies a session by forwarding cookies to the Falcon auth server.
 *
 * Use this in your backend API routes or middleware to check if a request
 * is authenticated. It forwards the session cookie from the incoming request
 * to the Falcon auth server's `/api/auth/get-session` endpoint.
 *
 * @example
 * ```ts
 * // Express middleware
 * import { verifySession } from "@falcon-framework/sdk/server";
 *
 * const authConfig = {
 *   serverUrl: "https://auth.example.com",
 *   publishableKey: "pk_live_abc123",
 * };
 *
 * app.use(async (req, res, next) => {
 *   const session = await verifySession(authConfig, req);
 *   if (!session) return res.status(401).json({ error: "Unauthorized" });
 *   req.user = session.user;
 *   next();
 * });
 * ```
 *
 * @example
 * ```ts
 * // Hono middleware
 * import { verifySession } from "@falcon-framework/sdk/server";
 *
 * app.use(async (c, next) => {
 *   const session = await verifySession(config, c.req.raw);
 *   if (!session) return c.json({ error: "Unauthorized" }, 401);
 *   c.set("user", session.user);
 *   await next();
 * });
 * ```
 */
export async function verifySession(
  config: VerifySessionConfig,
  request: Request | { headers: Headers | Record<string, string | string[] | undefined> },
): Promise<VerifiedSession | null> {
  try {
    // Extract cookie header from the incoming request
    let cookieHeader: string | undefined;

    if (request instanceof Request) {
      cookieHeader = request.headers.get("cookie") ?? undefined;
    } else if (request.headers instanceof Headers) {
      cookieHeader = request.headers.get("cookie") ?? undefined;
    } else {
      const raw = request.headers["cookie"];
      cookieHeader = Array.isArray(raw) ? raw.join("; ") : (raw ?? undefined);
    }

    if (!cookieHeader) {
      return null;
    }

    const url = `${config.serverUrl.replace(/\/$/, "")}/api/auth/get-session`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
        "X-Falcon-App-Id": config.publishableKey,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;

    if (!data || !data.user || !data.session) {
      return null;
    }

    return data as unknown as VerifiedSession;
  } catch {
    return null;
  }
}
