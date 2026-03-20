import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import {
  ApiForbiddenError,
  ApiNotFoundError,
  ApiConflictError,
  ApiUnprocessableError,
  AppListItem,
  CapabilityItem,
  CheckScopeBody,
  ConnectionDetail,
  ConnectionItem,
  CreateInstallationBody,
  FalconConnectionApi,
  InstallationRequestItem,
  SyncJobItem,
} from "./Definition.js";
import { germanMessages } from "./i18n.js";
import { AppService } from "./services/AppService.js";
import { ConnectionService } from "./services/ConnectionService.js";
import { InstallationService } from "./services/InstallationService.js";
import { ScopeService } from "./services/ScopeService.js";
import { SyncService } from "./services/SyncService.js";
import { PrincipalTag } from "./principal.js";

function formatDate(d: Date | string): string {
  return d instanceof Date ? d.toISOString() : d;
}

export const ApiHandlers = HttpApiBuilder.group(
  FalconConnectionApi,
  "api",
  (handlers) =>
    handlers
      // GET /v1/apps
      .handle("listApps", () =>
        Effect.gen(function* () {
          const svc = yield* AppService;
          const apps = yield* svc.listApps().pipe(Effect.orDie);
          return apps.map(
            (a) =>
              new AppListItem({
                id: a.id,
                slug: a.slug,
                name: a.name,
                description: a.description ?? null,
                status: a.status as "active" | "inactive",
                createdAt: formatDate(a.createdAt),
              }),
          );
        }),
      )
      // GET /v1/apps/:appId/capabilities
      .handle("getCapabilities", ({ path: { appId } }) =>
        Effect.gen(function* () {
          const svc = yield* AppService;
          const app = yield* svc.getApp(appId).pipe(
            Effect.flatMap((a) =>
              a
                ? Effect.succeed(a)
                : Effect.fail(
                    new ApiNotFoundError({
                      message: germanMessages.appNotFound(appId),
                    }),
                  ),
            ),
            Effect.catchTag("DatabaseError", () =>
              Effect.fail(
                new ApiNotFoundError({ message: germanMessages.appNotFound(appId) }),
              ),
            ),
          );
          void app;
          const caps = yield* svc.getCapabilities(appId).pipe(Effect.orDie);
          return caps.map(
            (c) =>
              new CapabilityItem({
                id: c.id,
                appId: c.appId,
                scopeKey: c.scopeKey,
                description: c.description ?? null,
              }),
          );
        }),
      )
      // POST /v1/installation-requests
      .handle("createInstallationRequest", ({ payload }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const body = payload as CreateInstallationBody;
          const svc = yield* InstallationService;
          const req = yield* svc
            .createRequest(principal, {
              sourceAppId: body.sourceAppId,
              targetAppId: body.targetAppId,
              requestedScopes: body.requestedScopes,
              settingsDraft: body.settingsDraft as Record<string, unknown> | undefined,
            })
            .pipe(
              Effect.catchTag("ForbiddenError", (e) =>
                Effect.fail(new ApiForbiddenError({ message: e.reason })),
              ),
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.orDie,
            );
          return new InstallationRequestItem({
            id: req.id,
            organizationId: req.organizationId,
            sourceAppId: req.sourceAppId,
            targetAppId: req.targetAppId,
            requestedScopes: req.requestedScopes as string[],
            status: req.status as "pending" | "approved" | "rejected" | "expired",
            initiatedByUserId: req.initiatedByUserId,
            createdAt: formatDate(req.createdAt),
          });
        }),
      )
      // POST /v1/installation-requests/:requestId/approve
      .handle("approveInstallationRequest", ({ path: { requestId } }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const svc = yield* InstallationService;
          const conn = yield* svc
            .approve(principal, requestId)
            .pipe(
              Effect.catchTag("ForbiddenError", (e) =>
                Effect.fail(new ApiForbiddenError({ message: e.reason })),
              ),
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.catchTag("DuplicateConnectionError", () =>
                Effect.fail(new ApiConflictError({ message: germanMessages.duplicateConnection })),
              ),
              Effect.catchTag("InvalidStateError", (e) =>
                Effect.fail(
                  new ApiUnprocessableError({
                    message: `Ungültiger Status: ${e.currentStatus}, erwartet: ${e.requiredStatus}`,
                  }),
                ),
              ),
              Effect.orDie,
            );
          return new ConnectionItem({
            id: conn.id,
            organizationId: conn.organizationId,
            sourceAppId: conn.sourceAppId,
            targetAppId: conn.targetAppId,
            status: conn.status as "active" | "paused" | "revoked",
            createdByUserId: conn.createdByUserId,
            createdAt: formatDate(conn.createdAt),
            updatedAt: formatDate(conn.updatedAt),
          });
        }),
      )
      // GET /v1/connections
      .handle("listConnections", () =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const svc = yield* ConnectionService;
          const conns = yield* svc.list(principal).pipe(Effect.orDie);
          return conns.map(
            (c) =>
              new ConnectionItem({
                id: c.id,
                organizationId: c.organizationId,
                sourceAppId: c.sourceAppId,
                targetAppId: c.targetAppId,
                status: c.status as "active" | "paused" | "revoked",
                createdByUserId: c.createdByUserId,
                createdAt: formatDate(c.createdAt),
                updatedAt: formatDate(c.updatedAt),
              }),
          );
        }),
      )
      // GET /v1/connections/:connectionId
      .handle("getConnection", ({ path: { connectionId } }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const svc = yield* ConnectionService;
          const detail = yield* svc
            .getDetail(principal, connectionId)
            .pipe(
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.orDie,
            );
          return new ConnectionDetail({
            id: detail.id,
            organizationId: detail.organizationId,
            sourceAppId: detail.sourceAppId,
            targetAppId: detail.targetAppId,
            status: detail.status as "active" | "paused" | "revoked",
            createdByUserId: detail.createdByUserId,
            createdAt: formatDate(detail.createdAt),
            updatedAt: formatDate(detail.updatedAt),
            scopes: detail.scopes,
            settings: detail.settings,
          });
        }),
      )
      // POST /v1/connections/:connectionId/revoke
      .handle("revokeConnection", ({ path: { connectionId } }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const svc = yield* ConnectionService;
          const conn = yield* svc
            .revoke(principal, connectionId)
            .pipe(
              Effect.catchTag("ForbiddenError", (e) =>
                Effect.fail(new ApiForbiddenError({ message: e.reason })),
              ),
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.orDie,
            );
          return new ConnectionItem({
            id: conn.id,
            organizationId: conn.organizationId,
            sourceAppId: conn.sourceAppId,
            targetAppId: conn.targetAppId,
            status: conn.status as "active" | "paused" | "revoked",
            createdByUserId: conn.createdByUserId,
            createdAt: formatDate(conn.createdAt),
            updatedAt: formatDate(conn.updatedAt),
          });
        }),
      )
      // POST /v1/connections/:connectionId/pause
      .handle("pauseConnection", ({ path: { connectionId } }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const svc = yield* ConnectionService;
          const conn = yield* svc
            .pause(principal, connectionId)
            .pipe(
              Effect.catchTag("ForbiddenError", (e) =>
                Effect.fail(new ApiForbiddenError({ message: e.reason })),
              ),
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.orDie,
            );
          return new ConnectionItem({
            id: conn.id,
            organizationId: conn.organizationId,
            sourceAppId: conn.sourceAppId,
            targetAppId: conn.targetAppId,
            status: conn.status as "active" | "paused" | "revoked",
            createdByUserId: conn.createdByUserId,
            createdAt: formatDate(conn.createdAt),
            updatedAt: formatDate(conn.updatedAt),
          });
        }),
      )
      // POST /v1/connections/:connectionId/sync
      .handle("triggerSync", ({ path: { connectionId } }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const svc = yield* SyncService;
          const job = yield* svc
            .triggerSync(principal, connectionId)
            .pipe(
              Effect.catchTag("ForbiddenError", (e) =>
                Effect.fail(new ApiForbiddenError({ message: e.reason })),
              ),
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.orDie,
            );
          return new SyncJobItem({
            id: job.id,
            connectionId: job.connectionId,
            status: job.status as "requested" | "running" | "completed" | "failed",
            createdAt: formatDate(job.createdAt),
          });
        }),
      )
      // POST /v1/scope-check
      .handle("checkScope", ({ payload }) =>
        Effect.gen(function* () {
          const principal = yield* PrincipalTag;
          const body = payload as CheckScopeBody;
          const svc = yield* ScopeService;
          const granted = yield* svc
            .checkScope(principal, body.connectionId, body.appId, body.scope)
            .pipe(
              Effect.catchTag("ForbiddenError", (e) =>
                Effect.fail(new ApiForbiddenError({ message: e.reason })),
              ),
              Effect.catchTag("NotFoundError", (e) =>
                Effect.fail(
                  new ApiNotFoundError({ message: `${e.resource} '${e.id}' nicht gefunden.` }),
                ),
              ),
              Effect.orDie,
            );
          return { granted };
        }),
      ),
);
