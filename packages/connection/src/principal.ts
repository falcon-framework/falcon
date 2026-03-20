import { member } from "@falcon-framework/db/schema/auth";
import { db } from "@falcon-framework/db";
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
): Promise<Principal | null> {
  // An explicit org header is required for every call
  const organizationId = headers.get("x-organization-id");
  if (!organizationId) return null;

  // 1. Try Better Auth session via cookie
  const cookie = headers.get("cookie");
  if (cookie) {
    try {
      const response = await fetch(`${betterAuthUrl}/api/auth/get-session`, {
        headers: { cookie },
      });
      if (response.ok) {
        const session = (await response.json()) as {
          user?: { id: string };
        };
        if (session?.user?.id) {
          const membership = await resolveOrgMembership(session.user.id, organizationId);
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
        const membership = await resolveOrgMembership(userId, organizationId);
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

export async function withPrincipal(
  request: Request,
  betterAuthUrl: string,
  handler: (principal: Principal) => Promise<Response>,
): Promise<Response> {
  const principal = await resolvePrincipal(request.headers, betterAuthUrl);

  if (!principal) {
    return Response.json({ error: germanMessages.unauthorized }, { status: 401 });
  }

  return handler(principal);
}
