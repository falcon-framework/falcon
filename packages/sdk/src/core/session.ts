import type { FalconAuthConfig, FalconSession, FalconUser } from "./types";

export interface FalconSessionResponse {
  user: FalconUser;
  session: FalconSession;
}

function authHeaders(config: FalconAuthConfig, contentType?: string): HeadersInit {
  return {
    ...(contentType ? { "Content-Type": contentType } : {}),
    "X-Falcon-App-Id": config.publishableKey,
  };
}

export async function fetchFalconSession(
  config: FalconAuthConfig,
): Promise<FalconSessionResponse | null> {
  const response = await fetch(`${config.serverUrl.replace(/\/$/, "")}/api/auth/get-session`, {
    method: "GET",
    credentials: "include",
    headers: authHeaders(config),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as Partial<FalconSessionResponse> | null;
  if (!data?.user || !data.session) {
    return null;
  }

  return data as FalconSessionResponse;
}

export async function signOutFalconSession(config: FalconAuthConfig): Promise<void> {
  await fetch(`${config.serverUrl.replace(/\/$/, "")}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
    headers: authHeaders(config, "application/json"),
  });
}
