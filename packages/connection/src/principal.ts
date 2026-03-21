import type { Db } from "@falcon-framework/db";
import { closeDb, makeDb } from "@falcon-framework/db";
import { member } from "@falcon-framework/db/schema/auth";
import { Context } from "effect";
import { and, eq } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { germanMessages } from "./i18n.js";

export interface Principal {
  userId: string;
  organizationId: string;
  role: string;
  authMethod: "session" | "jwt";
}

export class PrincipalTag extends Context.Tag("@falcon-framework/connection/Principal")<
  PrincipalTag,
  Principal
>() {}

async function resolveOrgMembership(
  db: Db,
  userId: string,
  organizationId: string,
): Promise<{ organizationId: string; role: string } | null> {
  const rows = await db
    .select()
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { organizationId: row.organizationId, role: row.role };
}

/**
 * Resolves the authenticated principal from request headers.
 *
 * Requires an explicit `X-Organization-Id` header — without it this function
 * returns null so the caller can respond with 401.  This avoids the
 * non-deterministic "first membership row" behaviour that would occur if we
 * fell back to picking an arbitrary org when none was specified.
 *
 * Auth strategies (tried in order):
 *   1. Better Auth session cookie → proxy GET /api/auth/get-session
 *   2. JWT Bearer token → verified against Better Auth JWKS
 */
export async function resolvePrincipal(
  headers: Headers,
  betterAuthUrl: string,
  db: Db,
): Promise<Principal | null> {
  // An explicit org header is required for every call (trim — clients sometimes send whitespace)
  const organizationId = headers.get("x-organization-id")?.trim();
  if (!organizationId) return null;

  // 1. Try Better Auth session via cookie
  const cookie = headers.get("cookie");
  const appId = headers.get("x-falcon-app-id")?.trim();
  if (cookie) {
    try {
      const response = await fetch(`${betterAuthUrl}/api/auth/get-session`, {
        headers: {
          cookie,
          ...(appId ? { "X-Falcon-App-Id": appId } : {}),
        },
      });
      if (response.ok) {
        const session = (await response.json()) as {
          user?: { id: string };
        };
        if (session?.user?.id) {
          const membership = await resolveOrgMembership(db, session.user.id, organizationId);
          if (membership) {
            return {
              userId: session.user.id,
              organizationId: membership.organizationId,
              role: membership.role,
              authMethod: "session",
            };
          }
        }
      }
    } catch {
      // Fall through to JWT
    }
  }

  // 2. Try JWT Bearer token
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const jwksUrl = new URL(`${betterAuthUrl}/.well-known/jwks.json`);
      const JWKS = createRemoteJWKSet(jwksUrl);
      const { payload } = await jwtVerify(token, JWKS);

      const userId = payload.sub;
      if (userId) {
        const membership = await resolveOrgMembership(db, userId, organizationId);
        if (membership) {
          return {
            userId,
            organizationId: membership.organizationId,
            role: membership.role,
            authMethod: "jwt",
          };
        }
      }
    } catch {
      // Invalid token
    }
  }

  return null;
}

/** Same as resolvePrincipal, but retries once when session + org were present (intermittent get-session / membership races). */
export async function resolvePrincipalWithRetry(
  headers: Headers,
  betterAuthUrl: string,
  db: Db,
): Promise<Principal | null> {
  const first = await resolvePrincipal(headers, betterAuthUrl, db);
  if (first) return first;
  const cookie = headers.get("cookie");
  const org = headers.get("x-organization-id")?.trim();
  if (cookie && org) {
    return resolvePrincipal(headers, betterAuthUrl, db);
  }
  return null;
}

export async function withPrincipal(
  request: Request,
  betterAuthUrl: string,
  handler: (principal: Principal) => Promise<Response>,
): Promise<Response> {
  const db = makeDb();
  try {
    const principal = await resolvePrincipal(request.headers, betterAuthUrl, db);

    if (!principal) {
      return Response.json({ error: germanMessages.unauthorized }, { status: 401 });
    }

    return handler(principal);
  } finally {
    await closeDb(db);
  }
}
