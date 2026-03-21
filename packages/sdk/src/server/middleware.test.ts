import { describe, expect, it, vi } from "vitest";
import { verifySession } from "./middleware";

describe("verifySession", () => {
  it("returns payload with optional organization fields", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            id: "u1",
            name: "Test",
            email: "t@test.com",
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          session: {
            id: "s1",
            token: "tok",
            userId: "u1",
            expiresAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            activeOrganizationId: "org_1",
          },
          activeOrganization: {
            id: "org_1",
            name: "Acme",
            slug: "acme",
            createdAt: new Date().toISOString(),
          },
          organizations: [],
        }),
        { status: 200 },
      ),
    );

    const result = await verifySession(
      { serverUrl: "https://auth.example.com", publishableKey: "pk_x" },
      new Request("https://app.test/api", { headers: { cookie: "a=b" } }),
    );

    expect(result).not.toBeNull();
    expect(result!.session.activeOrganizationId).toBe("org_1");
    expect(result!.activeOrganization?.name).toBe("Acme");
    expect(result!.organizations).toEqual([]);

    fetchSpy.mockRestore();
  });
});
