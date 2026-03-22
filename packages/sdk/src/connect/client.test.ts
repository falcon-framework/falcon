import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { createFalconConnectClient } from "./client";
import {
  FalconConnectNetworkError,
  FalconConnectParseError,
  FalconConnectValidationError,
} from "./error";

function jsonResponse(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
}

describe("createFalconConnectClient", () => {
  it("throws when baseUrl or organizationId is empty", () => {
    expect(() =>
      createFalconConnectClient({ baseUrl: "   ", organizationId: "org" }),
    ).toThrow(/baseUrl/);
    expect(() =>
      createFalconConnectClient({ baseUrl: "https://c.example", organizationId: "  " }),
    ).toThrow(/organizationId/);
  });

  it("lists apps with validated response", async () => {
    const apps = [
      {
        id: "1",
        slug: "a",
        name: "A",
        description: null,
        status: "active",
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ];
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse(apps));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(client.apps.list()).resolves.toEqual(apps);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const first = fetchFn.mock.calls[0];
    expect(first).toBeDefined();
    const [url, init] = first as [string, RequestInit];
    expect(url).toBe("https://connect.example/v1/apps");
    expect(init.headers).toBeInstanceOf(Headers);
    expect((init.headers as Headers).get("X-Organization-Id")).toBe("org-1");
  });

  it("sets publishable key headers via buildFalconConnectHeaders", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      publishableKey: "pk_test",
      fetch: fetchFn,
      credentials: "omit",
    });
    await client.apps.list();
    const callPk = fetchFn.mock.calls[0];
    expect(callPk).toBeDefined();
    const headersPk = callPk![1].headers as Headers;
    expect(headersPk.get("X-Falcon-App-Id")).toBe("pk_test");
    expect(headersPk.get("X-Organization-Id")).toBe("org-1");
  });

  it("sets Bearer token when getAccessToken returns a value", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([]));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      getAccessToken: () => "jwt-here",
      fetch: fetchFn,
      credentials: "omit",
    });
    await client.apps.list();
    const call0b = fetchFn.mock.calls[0];
    expect(call0b).toBeDefined();
    const headersB = call0b![1].headers as Headers;
    expect(headersB.get("Authorization")).toBe("Bearer jwt-here");
  });

  it("throws FalconConnectHttpError on non-OK with message field", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "nope" }, { status: 403 }));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(client.apps.list()).rejects.toMatchObject({
      name: "FalconConnectHttpError",
      status: 403,
      message: "nope",
    });
  });

  it("throws FalconConnectHttpError on 401 with error field", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ error: "Unauthorized" }, { status: 401 }));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(client.apps.list()).rejects.toMatchObject({
      name: "FalconConnectHttpError",
      status: 401,
      message: "Unauthorized",
    });
  });

  it("throws FalconConnectValidationError when JSON does not match schema", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse([{ broken: true }]));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(client.apps.list()).rejects.toBeInstanceOf(FalconConnectValidationError);
  });

  it("throws FalconConnectParseError when body is invalid JSON", async () => {
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("not-json", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(client.apps.list()).rejects.toBeInstanceOf(FalconConnectParseError);
  });

  it("throws FalconConnectNetworkError when fetch rejects", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError("offline"));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(client.apps.list()).rejects.toBeInstanceOf(FalconConnectNetworkError);
  });

  it("validates create installation input with Zod", async () => {
    const fetchFn = vi.fn();
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(
      client.installationRequests.create({
        sourceAppId: "a",
        targetAppId: "b",
        requestedScopes: [],
      }),
    ).rejects.toBeInstanceOf(ZodError);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("posts scope-check body as JSON object", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ granted: true }));
    const client = createFalconConnectClient({
      baseUrl: "https://connect.example",
      organizationId: "org-1",
      fetch: fetchFn,
      credentials: "omit",
    });
    await expect(
      client.scopes.check({
        connectionId: "c1",
        appId: "a1",
        scope: "demo.read",
      }),
    ).resolves.toEqual({ granted: true });
    const call0c = fetchFn.mock.calls[0];
    expect(call0c).toBeDefined();
    const init = call0c![1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({
      connectionId: "c1",
      appId: "a1",
      scope: "demo.read",
    });
  });
});
