import { connectFetchJson, type ConnectFetchContext } from "./request";
import {
  checkScopeBodySchema,
  createInstallationRequestBodySchema,
  falconConnectAppsListSchema,
  falconConnectCapabilitiesListSchema,
  falconConnectConnectionDetailSchema,
  falconConnectConnectionSchema,
  falconConnectConnectionsListSchema,
  falconConnectInstallationRequestSchema,
  falconConnectInstallationRequestsListSchema,
  falconConnectSyncJobSchema,
  scopeCheckResultSchema,
  type FalconConnectApp,
  type FalconConnectCapability,
  type FalconConnectCheckScopeBody,
  type FalconConnectConnection,
  type FalconConnectConnectionDetail,
  type FalconConnectCreateInstallationRequestBody,
  type FalconConnectInstallationRequest,
  type FalconConnectScopeCheckResult,
  type FalconConnectSyncJob,
} from "./schemas";

export interface CreateFalconConnectClientOptions {
  /** Connect service base URL without `/v1` (e.g. `https://connect.example.com`). */
  baseUrl: string;
  /** Better Auth organization id sent as `X-Organization-Id`. */
  organizationId: string;
  /**
   * Publishable key forwarded as `X-Falcon-App-Id` (recommended when using session cookies
   * against Better Auth get-session).
   */
  publishableKey?: string;
  credentials?: RequestCredentials;
  fetch?: typeof fetch;
  getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

function normalizeClientOptions(options: CreateFalconConnectClientOptions): ConnectFetchContext {
  const baseUrl = options.baseUrl.trim().replace(/\/+$/, "");
  const organizationId = options.organizationId.trim();
  if (!baseUrl) {
    throw new Error("createFalconConnectClient: baseUrl is required");
  }
  if (!organizationId) {
    throw new Error("createFalconConnectClient: organizationId is required");
  }
  return {
    baseUrl,
    organizationId,
    publishableKey: options.publishableKey?.trim() || undefined,
    credentials: options.credentials ?? "include",
    fetchFn: options.fetch ?? globalThis.fetch.bind(globalThis),
    getHeaders: options.getHeaders,
    getAccessToken: options.getAccessToken,
  };
}

export interface FalconConnectClient {
  readonly apps: {
    readonly list: () => Promise<FalconConnectApp[]>;
    readonly capabilities: (appId: string) => Promise<FalconConnectCapability[]>;
  };
  readonly installationRequests: {
    readonly list: () => Promise<FalconConnectInstallationRequest[]>;
    readonly create: (
      body: FalconConnectCreateInstallationRequestBody,
    ) => Promise<FalconConnectInstallationRequest>;
    readonly approve: (requestId: string) => Promise<FalconConnectConnection>;
  };
  readonly connections: {
    readonly list: () => Promise<FalconConnectConnection[]>;
    readonly get: (connectionId: string) => Promise<FalconConnectConnectionDetail>;
    readonly revoke: (connectionId: string) => Promise<FalconConnectConnection>;
    readonly pause: (connectionId: string) => Promise<FalconConnectConnection>;
    readonly resume: (connectionId: string) => Promise<FalconConnectConnection>;
    readonly sync: (connectionId: string) => Promise<FalconConnectSyncJob>;
  };
  readonly scopes: {
    readonly check: (input: FalconConnectCheckScopeBody) => Promise<FalconConnectScopeCheckResult>;
  };
}

export function createFalconConnectClient(
  options: CreateFalconConnectClientOptions,
): FalconConnectClient {
  const ctx = normalizeClientOptions(options);

  return {
    apps: {
      list: () => connectFetchJson(ctx, "/apps", {}, falconConnectAppsListSchema),
      capabilities: (appId: string) =>
        connectFetchJson(
          ctx,
          `/apps/${encodeURIComponent(appId)}/capabilities`,
          {},
          falconConnectCapabilitiesListSchema,
        ),
    },
    installationRequests: {
      list: () =>
        connectFetchJson(
          ctx,
          "/installation-requests",
          {},
          falconConnectInstallationRequestsListSchema,
        ),
      create: async (body: FalconConnectCreateInstallationRequestBody) => {
        const payload = createInstallationRequestBodySchema.parse(body);
        return connectFetchJson(
          ctx,
          "/installation-requests",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
          falconConnectInstallationRequestSchema,
        );
      },
      approve: (requestId: string) =>
        connectFetchJson(
          ctx,
          `/installation-requests/${encodeURIComponent(requestId)}/approve`,
          { method: "POST" },
          falconConnectConnectionSchema,
        ),
    },
    connections: {
      list: () => connectFetchJson(ctx, "/connections", {}, falconConnectConnectionsListSchema),
      get: (connectionId: string) =>
        connectFetchJson(
          ctx,
          `/connections/${encodeURIComponent(connectionId)}`,
          {},
          falconConnectConnectionDetailSchema,
        ),
      revoke: (connectionId: string) =>
        connectFetchJson(
          ctx,
          `/connections/${encodeURIComponent(connectionId)}/revoke`,
          { method: "POST" },
          falconConnectConnectionSchema,
        ),
      pause: (connectionId: string) =>
        connectFetchJson(
          ctx,
          `/connections/${encodeURIComponent(connectionId)}/pause`,
          { method: "POST" },
          falconConnectConnectionSchema,
        ),
      resume: (connectionId: string) =>
        connectFetchJson(
          ctx,
          `/connections/${encodeURIComponent(connectionId)}/resume`,
          { method: "POST" },
          falconConnectConnectionSchema,
        ),
      sync: (connectionId: string) =>
        connectFetchJson(
          ctx,
          `/connections/${encodeURIComponent(connectionId)}/sync`,
          { method: "POST" },
          falconConnectSyncJobSchema,
        ),
    },
    scopes: {
      check: async (input: FalconConnectCheckScopeBody) => {
        const body = checkScopeBodySchema.parse(input);
        return connectFetchJson(
          ctx,
          "/scope-check",
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          scopeCheckResultSchema,
        );
      },
    },
  };
}
