import { env } from "@falcon-framework/env/web";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface ConnectionDetail extends ConnectionItem {
  scopes: string[];
  settings: unknown;
}

export interface SyncJobItem {
  id: string;
  connectionId: string;
  status: "requested" | "running" | "completed" | "failed";
  createdAt: string;
}

// ─── Client Factory ───────────────────────────────────────────────────────────

class ConnectApiError extends Error {
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
  const url = `${env.VITE_CONNECT_URL}/v1${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": organizationId,
      ...(init.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ConnectApiError(res.status, body.message ?? res.statusText);
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
      get: (connectionId: string) => r<ConnectionDetail>(`/connections/${connectionId}`),
      revoke: (connectionId: string) =>
        r<ConnectionItem>(`/connections/${connectionId}/revoke`, { method: "POST" }),
      pause: (connectionId: string) =>
        r<ConnectionItem>(`/connections/${connectionId}/pause`, { method: "POST" }),
      sync: (connectionId: string) =>
        r<SyncJobItem>(`/connections/${connectionId}/sync`, { method: "POST" }),
    },
    scopes: {
      check: (connectionId: string, appId: string, scope: string) =>
        r<{ granted: boolean }>("/scope-check", {
          method: "POST",
          body: JSON.stringify({ connectionId, appId, scope }),
        }),
    },
  };
}
