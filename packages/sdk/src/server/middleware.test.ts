import { describe, expect, it, vi } from "vitest";
import { verifySession } from "./middleware";
import { mintFalconConnectAccessToken } from "./connect-token";

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

  it("rebuilds the Falcon cookie header from a raw session token", async () => {
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
          },
        }),
        { status: 200 },
      ),
    );

    const result = await verifySession(
      { serverUrl: "https://auth.example.com", publishableKey: "pk_demo" },
      { sessionToken: "session-token-123" },
    );

    expect(result?.user.id).toBe("u1");
    const call = fetchSpy.mock.calls[0];
    expect(call).toBeDefined();
    const headers = (call![1] as RequestInit).headers as Record<string, string>;
    expect(headers.Cookie).toBe("falcon_pk_demo.session_token=session-token-123");

    fetchSpy.mockRestore();
  });
});

describe("mintFalconConnectAccessToken", () => {
  it("posts the org id and forwards the rebuilt Falcon cookie", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: "jwt-1",
          expiresAt: "2026-01-01T00:05:00.000Z",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await mintFalconConnectAccessToken(
      { serverUrl: "https://auth.example.com", publishableKey: "pk_demo" },
      {
        organizationId: "org_123",
        sessionToken: "raw-session-token",
        fetch: fetchFn,
      },
    );

    expect(result).toEqual({
      accessToken: "jwt-1",
      expiresAt: "2026-01-01T00:05:00.000Z",
    });

    const call = fetchFn.mock.calls[0];
    expect(call).toBeDefined();
    const [url, init] = call as [string, RequestInit];
    expect(url).toBe("https://auth.example.com/auth/connect/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ organizationId: "org_123" });
    expect((init.headers as Record<string, string>).Cookie).toBe(
      "falcon_pk_demo.session_token=raw-session-token",
    );
    expect((init.headers as Record<string, string>)["X-Falcon-App-Id"]).toBe("pk_demo");
  });
});
