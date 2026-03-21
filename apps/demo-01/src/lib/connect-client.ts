import { demoEnv } from "#/lib/demo-env";

export interface AppItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  createdAt: string;
}

export interface CapabilityItem {
  id: string;
  appId: string;
  scopeKey: string;
  description: string | null;
}

export interface InstallationRequestItem {
  id: string;
  organizationId: string;
  sourceAppId: string;
  targetAppId: string;
  requestedScopes: string[];
  status: "pending" | "approved" | "rejected" | "expired";
  initiatedByUserId: string;
  createdAt: string;
}

export interface ConnectionItem {
  id: string;
  organizationId: string;
  sourceAppId: string;
  targetAppId: string;
  status: "active" | "paused" | "revoked";
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export class ConnectApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ConnectApiError";
  }
}

async function request<T>(
  path: string,
  organizationId: string,
  init: RequestInit = {},
): Promise<T> {
  if (!organizationId?.trim()) {
    throw new ConnectApiError(0, "Missing X-Organization-Id");
  }
  const base = demoEnv.VITE_CONNECT_URL;
  const url = `${base}/v1${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Falcon-App-Id": demoEnv.VITE_FALCON_PUBLISHABLE_KEY,
      "X-Organization-Id": organizationId.trim(),
      ...(init.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    const msg =
      typeof body === "object" && body && "message" in body
        ? String((body as { message?: string }).message ?? res.statusText)
        : res.statusText;
    throw new ConnectApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

export function makeConnectClient(organizationId: string) {
  const r = <T>(path: string, init?: RequestInit) => request<T>(path, organizationId, init);

  return {
    apps: {
      list: () => r<AppItem[]>("/apps"),
      capabilities: (appId: string) => r<CapabilityItem[]>(`/apps/${appId}/capabilities`),
    },
    installationRequests: {
      list: () => r<InstallationRequestItem[]>("/installation-requests"),
      create: (body: {
        sourceAppId: string;
        targetAppId: string;
        requestedScopes: string[];
        settingsDraft?: Record<string, unknown>;
      }) =>
        r<InstallationRequestItem>("/installation-requests", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      approve: (requestId: string) =>
        r<ConnectionItem>(`/installation-requests/${requestId}/approve`, {
          method: "POST",
        }),
    },
    connections: {
      list: () => r<ConnectionItem[]>("/connections"),
    },
  };
}
