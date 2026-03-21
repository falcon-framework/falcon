import { env } from "@falcon-framework/env/web";

export interface AuthAppItem {
  appId: string;
  name: string;
  connectedAt: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${env.VITE_SERVER_URL}/api/user${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const authAppsClient = {
  list: () => request<AuthAppItem[]>("/apps"),
  revoke: (appId: string) => request<void>(`/apps/${appId}`, { method: "DELETE" }),
};
