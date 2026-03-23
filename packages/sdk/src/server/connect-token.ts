import type { FalconAuthConfig } from "../core/types";
import type { FalconServerAuthInput, IncomingServerRequest } from "./auth-request";
import { resolveCookieHeader } from "./auth-request";

export interface FalconConnectAccessTokenResult {
  accessToken: string;
  expiresAt: string;
}

export interface MintFalconConnectAccessTokenOptions extends FalconServerAuthInput {
  organizationId: string;
  fetch?: typeof fetch;
}

export async function mintFalconConnectAccessToken(
  config: FalconAuthConfig,
  options: MintFalconConnectAccessTokenOptions,
): Promise<FalconConnectAccessTokenResult | null> {
  const organizationId = options.organizationId?.trim();
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  const cookieHeader = resolveCookieHeader(config.publishableKey, {
    incomingRequest: options.incomingRequest,
    sessionToken: options.sessionToken,
  });
  if (!cookieHeader) {
    return null;
  }

  const fetchFn = options.fetch ?? globalThis.fetch.bind(globalThis);
  const response = await fetchFn(`${config.serverUrl.replace(/\/$/, "")}/auth/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
      "X-Falcon-App-Id": config.publishableKey,
    },
    body: JSON.stringify({ organizationId }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<FalconConnectAccessTokenResult> | null;
  if (!data?.accessToken || !data.expiresAt) {
    return null;
  }

  return data as FalconConnectAccessTokenResult;
}

export type { FalconServerAuthInput, IncomingServerRequest };
