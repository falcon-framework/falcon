import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

// ── Shared schemas ──────────────────────────────────────────────────────────

export class AppListItem extends Schema.Class<AppListItem>("AppListItem")({
  id: Schema.String,
  slug: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  status: Schema.Literal("active", "inactive"),
  createdAt: Schema.String,
}) {}

export class CapabilityItem extends Schema.Class<CapabilityItem>("CapabilityItem")({
  id: Schema.String,
  appId: Schema.String,
  scopeKey: Schema.String,
  description: Schema.NullOr(Schema.String),
}) {}

export class InstallationRequestItem extends Schema.Class<InstallationRequestItem>(
  "InstallationRequestItem",
)({
  id: Schema.String,
  organizationId: Schema.String,
  sourceAppId: Schema.String,
  targetAppId: Schema.String,
  requestedScopes: Schema.Array(Schema.String),
  status: Schema.Literal("pending", "approved", "rejected", "expired"),
  initiatedByUserId: Schema.String,
  createdAt: Schema.String,
}) {}

export class ConnectionItem extends Schema.Class<ConnectionItem>("ConnectionItem")({
  id: Schema.String,
  organizationId: Schema.String,
  sourceAppId: Schema.String,
  targetAppId: Schema.String,
  status: Schema.Literal("active", "paused", "revoked"),
  createdByUserId: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
}) {}

export class ConnectionDetail extends Schema.Class<ConnectionDetail>("ConnectionDetail")({
  id: Schema.String,
  organizationId: Schema.String,
  sourceAppId: Schema.String,
  targetAppId: Schema.String,
  status: Schema.Literal("active", "paused", "revoked"),
  createdByUserId: Schema.String,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  scopes: Schema.Array(Schema.String),
  settings: Schema.NullOr(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
}) {}

export class SyncJobItem extends Schema.Class<SyncJobItem>("SyncJobItem")({
  id: Schema.String,
  connectionId: Schema.String,
  status: Schema.Literal("requested", "running", "completed", "failed"),
  createdAt: Schema.String,
}) {}

// ── Request bodies ───────────────────────────────────────────────────────────

export class CreateInstallationBody extends Schema.Class<CreateInstallationBody>(
  "CreateInstallationBody",
)({
  sourceAppId: Schema.String,
  targetAppId: Schema.String,
  requestedScopes: Schema.Array(Schema.String),
  settingsDraft: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
}) {}

export class CheckScopeBody extends Schema.Class<CheckScopeBody>("CheckScopeBody")({
  connectionId: Schema.String,
  appId: Schema.String,
  scope: Schema.String,
}) {}

// ── Error schemas ────────────────────────────────────────────────────────────

export class ApiNotFoundError extends Schema.TaggedError<ApiNotFoundError>()("ApiNotFoundError", {
  message: Schema.String,
}) {}

export class ApiForbiddenError extends Schema.TaggedError<ApiForbiddenError>()(
  "ApiForbiddenError",
  {
    message: Schema.String,
  },
) {}

export class ApiConflictError extends Schema.TaggedError<ApiConflictError>()("ApiConflictError", {
  message: Schema.String,
}) {}

export class ApiUnprocessableError extends Schema.TaggedError<ApiUnprocessableError>()(
  "ApiUnprocessableError",
  {
    message: Schema.String,
  },
) {}

// ── API Group ─────────────────────────────────────────────────────────────────

const ApiGroup = HttpApiGroup.make("api")
  // GET /apps
  .add(HttpApiEndpoint.get("listApps", "/apps").addSuccess(Schema.Array(AppListItem)))
  // GET /apps/:appId/capabilities
  .add(
    HttpApiEndpoint.get("getCapabilities", "/apps/:appId/capabilities")
      .setPath(Schema.Struct({ appId: Schema.String }))
      .addSuccess(Schema.Array(CapabilityItem))
      .addError(ApiNotFoundError, { status: 404 }),
  )
  // GET /installation-requests
  .add(
    HttpApiEndpoint.get("listInstallationRequests", "/installation-requests").addSuccess(
      Schema.Array(InstallationRequestItem),
    ),
  )
  // POST /installation-requests
  .add(
    HttpApiEndpoint.post("createInstallationRequest", "/installation-requests")
      .setPayload(CreateInstallationBody)
      .addSuccess(InstallationRequestItem, { status: 201 })
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 })
      .addError(ApiConflictError, { status: 409 }),
  )
  // POST /installation-requests/:requestId/approve
  .add(
    HttpApiEndpoint.post("approveInstallationRequest", "/installation-requests/:requestId/approve")
      .setPath(Schema.Struct({ requestId: Schema.String }))
      .addSuccess(ConnectionItem, { status: 201 })
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 })
      .addError(ApiConflictError, { status: 409 })
      .addError(ApiUnprocessableError, { status: 422 }),
  )
  // GET /connections
  .add(
    HttpApiEndpoint.get("listConnections", "/connections").addSuccess(Schema.Array(ConnectionItem)),
  )
  // GET /connections/:connectionId
  .add(
    HttpApiEndpoint.get("getConnection", "/connections/:connectionId")
      .setPath(Schema.Struct({ connectionId: Schema.String }))
      .addSuccess(ConnectionDetail)
      .addError(ApiNotFoundError, { status: 404 }),
  )
  // POST /connections/:connectionId/revoke
  .add(
    HttpApiEndpoint.post("revokeConnection", "/connections/:connectionId/revoke")
      .setPath(Schema.Struct({ connectionId: Schema.String }))
      .addSuccess(ConnectionItem)
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 }),
  )
  // POST /connections/:connectionId/pause
  .add(
    HttpApiEndpoint.post("pauseConnection", "/connections/:connectionId/pause")
      .setPath(Schema.Struct({ connectionId: Schema.String }))
      .addSuccess(ConnectionItem)
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 }),
  )
  // POST /connections/:connectionId/resume
  .add(
    HttpApiEndpoint.post("resumeConnection", "/connections/:connectionId/resume")
      .setPath(Schema.Struct({ connectionId: Schema.String }))
      .addSuccess(ConnectionItem)
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 })
      .addError(ApiUnprocessableError, { status: 422 }),
  )
  // POST /connections/:connectionId/sync
  .add(
    HttpApiEndpoint.post("triggerSync", "/connections/:connectionId/sync")
      .setPath(Schema.Struct({ connectionId: Schema.String }))
      .addSuccess(SyncJobItem, { status: 201 })
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 }),
  )
  // POST /scope-check
  .add(
    HttpApiEndpoint.post("checkScope", "/scope-check")
      .setPayload(CheckScopeBody)
      .addSuccess(Schema.Struct({ granted: Schema.Boolean }))
      .addError(ApiForbiddenError, { status: 403 })
      .addError(ApiNotFoundError, { status: 404 }),
  );

// ── Top-level API ─────────────────────────────────────────────────────────────

export const FalconConnectionApi = HttpApi.make("falcon-connection").add(ApiGroup.prefix("/v1"));
