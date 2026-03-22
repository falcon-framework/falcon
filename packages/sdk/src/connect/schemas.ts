/**
 * Zod contracts for Falcon Connect API v1.
 * Keep aligned with `packages/connection/src/Definition.ts` (Effect HttpApi).
 */
import { z } from "zod";

const recordUnknown = z.record(z.string(), z.unknown());

export const falconConnectAppSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["active", "inactive"]),
  createdAt: z.string(),
});
export type FalconConnectApp = z.infer<typeof falconConnectAppSchema>;

export const falconConnectCapabilitySchema = z.object({
  id: z.string(),
  appId: z.string(),
  scopeKey: z.string(),
  description: z.string().nullable(),
});
export type FalconConnectCapability = z.infer<typeof falconConnectCapabilitySchema>;

export const falconConnectInstallationRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  sourceAppId: z.string(),
  targetAppId: z.string(),
  requestedScopes: z.array(z.string()),
  status: z.enum(["pending", "approved", "rejected", "expired"]),
  initiatedByUserId: z.string(),
  createdAt: z.string(),
});
export type FalconConnectInstallationRequest = z.infer<typeof falconConnectInstallationRequestSchema>;

export const falconConnectConnectionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  sourceAppId: z.string(),
  targetAppId: z.string(),
  status: z.enum(["active", "paused", "revoked"]),
  createdByUserId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FalconConnectConnection = z.infer<typeof falconConnectConnectionSchema>;

export const falconConnectConnectionDetailSchema = falconConnectConnectionSchema.extend({
  scopes: z.array(z.string()),
  settings: recordUnknown.nullable(),
});
export type FalconConnectConnectionDetail = z.infer<typeof falconConnectConnectionDetailSchema>;

export const falconConnectSyncJobSchema = z.object({
  id: z.string(),
  connectionId: z.string(),
  status: z.enum(["requested", "running", "completed", "failed"]),
  createdAt: z.string(),
});
export type FalconConnectSyncJob = z.infer<typeof falconConnectSyncJobSchema>;

export const createInstallationRequestBodySchema = z.object({
  sourceAppId: z.string().min(1),
  targetAppId: z.string().min(1),
  requestedScopes: z.array(z.string().min(1)).min(1),
  settingsDraft: recordUnknown.optional(),
});
export type FalconConnectCreateInstallationRequestBody = z.infer<
  typeof createInstallationRequestBodySchema
>;

export const checkScopeBodySchema = z.object({
  connectionId: z.string().min(1),
  appId: z.string().min(1),
  scope: z.string().min(1),
});
export type FalconConnectCheckScopeBody = z.infer<typeof checkScopeBodySchema>;

export const scopeCheckResultSchema = z.object({
  granted: z.boolean(),
});
export type FalconConnectScopeCheckResult = z.infer<typeof scopeCheckResultSchema>;

export const falconConnectAppsListSchema = z.array(falconConnectAppSchema);
export const falconConnectCapabilitiesListSchema = z.array(falconConnectCapabilitySchema);
export const falconConnectInstallationRequestsListSchema = z.array(
  falconConnectInstallationRequestSchema,
);
export const falconConnectConnectionsListSchema = z.array(falconConnectConnectionSchema);
