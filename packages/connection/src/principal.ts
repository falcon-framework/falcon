import { member } from "@falcon-framework/db/schema/auth";
import { db } from "@falcon-framework/db";
import { Context } from "effect";
import { eq, and } from "drizzle-orm";
import { createRemoteJWKSet, jwtVerify } from "jose";

export interface Principal {
  userId: string;
  organizationId: string;
  role: string;
  authMethod: "session" | "jwt";
}

export class PrincipalTag extends Context.Tag(
  "@falcon-framework/connection/Principal",
)<PrincipalTag, Principal>() {}

async function resolveOrgMembership(
  userId: string,
  organizationId: string | undefined,
): Promise<{ organizationId: string; role: string } | null> {
  // If no org specified, find the first org the user belongs to
  if (!organizationId) {
    const rows = await db
      .select()
      .from(member)
      .where(eq(member.userId, userId))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { organizationId: row.organizationId, role: row.role };
  }

  const rows = await db
    .select()
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, organizationId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return { organizationId: row.organizationId, role: row.role };
}

export async function resolvePrincipal(
  headers: Headers,
  betterAuthUrl: string,
): Promise<Principal | null> {
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
          session?: { activeOrganizationId?: string };
        };
        if (session?.user?.id) {
          const orgId = session.session?.activeOrganizationId;
          const membership = await resolveOrgMembership(session.user.id, orgId);
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
      // Fetch JWKS from Better Auth
      const jwksUrl = new URL(`${betterAuthUrl}/.well-known/jwks.json`);
      const JWKS = createRemoteJWKSet(jwksUrl);
      const { payload } = await jwtVerify(token, JWKS);

      const userId = payload.sub;
      const orgId = payload["org_id"] as string | undefined;

      if (userId) {
        const membership = await resolveOrgMembership(userId, orgId);
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
    return Response.json(
      { error: "Authentifizierung erforderlich. Bitte melden Sie sich an." },
      { status: 401 },
    );
  }

  return handler(principal);
}
