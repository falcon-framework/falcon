import { canApproveInstallation, canCreateInstallationRequest } from "@falcon-framework/auth";
import {
  connection,
  connectionScope,
  connectionSetting,
  installationRequest,
} from "@falcon-framework/db/schema/connection";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import {
  DuplicateConnectionError,
  DuplicateInstallationRequestError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  DatabaseError,
} from "../errors.js";
import { DbService } from "../Db.js";
import {
  ConnectionRepository,
  type ConnectionRow,
  InstallationRepository,
  type InstallationRequestRow,
} from "../repositories/index.js";
import { AuditService } from "./AuditService.js";
import type { Principal } from "../principal.js";

export interface InstallationServiceService {
  listPending(principal: Principal): Effect.Effect<InstallationRequestRow[], DatabaseError>;
  createRequest(
    principal: Principal,
    data: {
      sourceAppId: string;
      targetAppId: string;
      requestedScopes: readonly string[];
      settingsDraft?: Record<string, unknown>;
    },
  ): Effect.Effect<
    InstallationRequestRow,
    | ForbiddenError
    | NotFoundError
    | DuplicateInstallationRequestError
    | DuplicateConnectionError
    | DatabaseError
  >;
  approve(
    principal: Principal,
    installationId: string,
  ): Effect.Effect<
    ConnectionRow,
    ForbiddenError | NotFoundError | InvalidStateError | DuplicateConnectionError | DatabaseError
  >;
}

export class InstallationService extends Context.Tag(
  "@falcon-framework/connection/InstallationService",
)<InstallationService, InstallationServiceService>() {}

export const InstallationServiceLive = Layer.effect(
  InstallationService,
  Effect.gen(function* () {
    const db = yield* DbService;
    const installationRepo = yield* InstallationRepository;
    const connectionRepo = yield* ConnectionRepository;
    const auditService = yield* AuditService;

    return {
      listPending: (principal: Principal) =>
        installationRepo.listPendingByOrganization(principal.organizationId),

      createRequest: (
        principal: Principal,
        data: {
          sourceAppId: string;
          targetAppId: string;
          requestedScopes: readonly string[];
          settingsDraft?: Record<string, unknown>;
        },
      ) =>
        Effect.gen(function* () {
          if (!canCreateInstallationRequest(principal.role)) {
            return yield* new ForbiddenError({
              reason: "Insufficient role to create installation request",
            });
          }

          const pendingDuplicate = yield* installationRepo.findPendingByOrgAndAppPair(
            principal.organizationId,
            data.sourceAppId,
            data.targetAppId,
          );
          if (pendingDuplicate) {
            return yield* new DuplicateInstallationRequestError({
              organizationId: principal.organizationId,
              sourceAppId: data.sourceAppId,
              targetAppId: data.targetAppId,
            });
          }

          const connectionDuplicate = yield* connectionRepo.findNonRevokedByOrgAndAppPair(
            principal.organizationId,
            data.sourceAppId,
            data.targetAppId,
          );
          if (connectionDuplicate) {
            return yield* new DuplicateConnectionError({
              organizationId: principal.organizationId,
              sourceAppId: data.sourceAppId,
              targetAppId: data.targetAppId,
            });
          }

          const id = crypto.randomUUID();
          const row = yield* installationRepo.create({
            id,
            organizationId: principal.organizationId,
            sourceAppId: data.sourceAppId,
            targetAppId: data.targetAppId,
            requestedScopes: data.requestedScopes,
            settingsDraft: data.settingsDraft,
            initiatedByUserId: principal.userId,
          });
          yield* auditService.log(
            principal.organizationId,
            principal.userId,
            "installation_request.created",
            { installationRequestId: id },
          );
          return row;
        }),

      approve: (principal: Principal, installationId: string) =>
        Effect.gen(function* () {
          if (!canApproveInstallation(principal.role)) {
            return yield* new ForbiddenError({
              reason: "Insufficient role to approve installation",
            });
          }

          const req = yield* installationRepo.findById(installationId);
          if (!req) {
            return yield* new NotFoundError({
              resource: "installation_request",
              id: installationId,
            });
            return undefined as never;
          }

          if (req.organizationId !== principal.organizationId) {
            return yield* new ForbiddenError({
              reason: "Installation request belongs to a different organization",
            });
          }

          if (req.status !== "pending") {
            return yield* new InvalidStateError({
              resource: "installation_request",
              currentStatus: req.status,
              requiredStatus: "pending",
            });
          }

          const duplicate = yield* connectionRepo.findDuplicate(
            principal.organizationId,
            req.sourceAppId,
            req.targetAppId,
          );
          if (duplicate) {
            return yield* new DuplicateConnectionError({
              organizationId: principal.organizationId,
              sourceAppId: req.sourceAppId,
              targetAppId: req.targetAppId,
            });
          }

          const connId = crypto.randomUUID();
          const scopes = req.requestedScopes as string[];

          // Atomically create connection + scopes + settings + mark request approved
          const conn = yield* Effect.tryPromise({
            try: () =>
              db.transaction(async (tx) => {
                const [newConn] = await tx
                  .insert(connection)
                  .values({
                    id: connId,
                    organizationId: principal.organizationId,
                    sourceAppId: req.sourceAppId,
                    targetAppId: req.targetAppId,
                    installationRequestId: req.id,
                    createdByUserId: principal.userId,
                    status: "active",
                  })
                  .returning();

                if (scopes.length > 0) {
                  await tx.insert(connectionScope).values(
                    scopes.map((scopeKey) => ({
                      id: crypto.randomUUID(),
                      connectionId: connId,
                      scopeKey,
                    })),
                  );
                }

                if (req.settingsDraft) {
                  await tx.insert(connectionSetting).values({
                    id: crypto.randomUUID(),
                    connectionId: connId,
                    settings: req.settingsDraft,
                    version: 1,
                  });
                }

                await tx
                  .update(installationRequest)
                  .set({ status: "approved", updatedAt: new Date() })
                  .where(eq(installationRequest.id, installationId));

                return newConn!;
              }),
            catch: (e) =>
              new DatabaseError({
                message: "Failed to approve installation request",
                cause: e,
              }),
          });

          yield* auditService.log(
            principal.organizationId,
            principal.userId,
            "installation_request.approved",
            { installationRequestId: installationId, connectionId: connId },
          );

          return conn;
        }),
    };
  }),
);
