import { describe, expect, it, vi } from "vitest";

const createAuthClient = vi.fn(
  (_config: {
    baseURL: string;
    plugins: unknown[];
    fetchOptions: { customFetchImpl: typeof fetch };
  }) => ({ mocked: true }),
);
const organizationClient = vi.fn(() => ({ name: "organization-plugin" }));

vi.mock("better-auth/react", () => ({
  createAuthClient,
}));

vi.mock("better-auth/client/plugins", () => ({
  organizationClient,
}));

describe("createFalconAuthClient", () => {
  it("creates a credentialed cross-origin auth client", async () => {
    const { createFalconAuthClient } = await import("./client");

    const client = createFalconAuthClient({
      serverUrl: "https://auth.example.com",
      publishableKey: "pk_demo",
    });

    expect(client).toEqual({ mocked: true });
    expect(createAuthClient).toHaveBeenCalledWith({
      baseURL: "https://auth.example.com",
      plugins: [{ name: "organization-plugin" }],
      fetchOptions: {
        customFetchImpl: expect.any(Function),
      },
    });

    const firstCall = createAuthClient.mock.calls[0];
    expect(firstCall).toBeDefined();

    const firstArg = firstCall![0];
    const customFetch = firstArg.fetchOptions.customFetchImpl;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

    await customFetch("https://auth.example.com/api/auth/get-session", {
      headers: {
        Accept: "application/json",
      },
    });

    expect(fetchSpy).toHaveBeenCalledWith("https://auth.example.com/api/auth/get-session", {
      credentials: "include",
      headers: new Headers({
        Accept: "application/json",
        "X-Falcon-App-Id": "pk_demo",
      }),
    });

    fetchSpy.mockRestore();
  });
});
