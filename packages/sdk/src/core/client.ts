import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { FalconAuthConfig } from "./types";

export type FalconAuthClient = ReturnType<typeof createFalconAuthClient>;

/**
 * Creates a Falcon Auth client that wraps Better-Auth's React client.
 *
 * The client automatically injects the `X-Falcon-App-Id` header on every request
 * so the Falcon auth server can identify which external app is making the request.
 *
 * @example
 * ```ts
 * import { createFalconAuth } from "@falcon-framework/sdk";
 *
 * export const falconAuth = createFalconAuth({
 *   serverUrl: "https://auth.example.com",
 *   publishableKey: "pk_live_abc123",
 * });
 * ```
 */
export function createFalconAuthClient(config: FalconAuthConfig) {
  const authFetch: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("X-Falcon-App-Id", config.publishableKey);

    return fetch(input, {
      ...init,
      credentials: init?.credentials ?? "include",
      headers,
    });
  };

  const client = createAuthClient({
    baseURL: config.serverUrl,
    plugins: [organizationClient()],
    fetchOptions: {
      customFetchImpl: authFetch,
    },
  });

  return client;
}
