import {
  canApproveInstallation,
  canCreateInstallationRequest,
} from "@falcon-framework/auth";
import { Context, Effect, Layer } from "effect";
import {
  DuplicateConnectionError,
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  type DatabaseError,
} from "../errors.js";
import {
  ConnectionRepository,
  type ConnectionRow,
  InstallationRepository,
  type InstallationRequestRow,
  ScopeRepository,
  SettingsRepository,
} from "../repositories/index.js";
import { AuditService } from "./AuditService.js";
import type { Principal } from "../principal.js";

export interface InstallationServiceService {
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
    ForbiddenError | NotFoundError | DatabaseError
  >;
  approve(
    principal: Principal,
    installationId: string,
  ): Effect.Effect<
    ConnectionRow,
    | ForbiddenError
    | NotFoundError
    | InvalidStateError
    | DuplicateConnectionError
    | DatabaseError
  >;
}

export class InstallationService extends Context.Tag(
  "@falcon-framework/connection/InstallationService",
)<InstallationService, InstallationServiceService>() {}

export const InstallationServiceLive = Layer.effect(
  InstallationService,
  Effect.gen(function* () {
    const installationRepo = yield* InstallationRepository;
    const connectionRepo = yield* ConnectionRepository;
    const scopeRepo = yield* ScopeRepository;
    const settingsRepo = yield* SettingsRepository;
    const auditService = yield* AuditService;

    return {
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
            yield* new ForbiddenError({
              reason: "Insufficient role to create installation request",
            });
          }
          const id = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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
            yield* new ForbiddenError({
              reason: "Insufficient role to approve installation",
            });
          }

          const req = yield* installationRepo.findById(installationId);
          if (!req) {
            yield* new NotFoundError({
              resource: "installation_request",
              id: installationId,
            });
            // TypeScript needs help after yield* with error types
            return undefined as never;
          }

          if (req.organizationId !== principal.organizationId) {
            yield* new ForbiddenError({
              reason: "Installation request belongs to a different organization",
            });
          }

          if (req.status !== "pending") {
            yield* new InvalidStateError({
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
            yield* new DuplicateConnectionError({
              organizationId: principal.organizationId,
              sourceAppId: req.sourceAppId,
              targetAppId: req.targetAppId,
            });
          }

          const connId = `conn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          const conn = yield* connectionRepo.create({
            id: connId,
            organizationId: principal.organizationId,
            sourceAppId: req.sourceAppId,
            targetAppId: req.targetAppId,
            installationRequestId: req.id,
            createdByUserId: principal.userId,
          });

          const scopes = req.requestedScopes as string[];
          yield* scopeRepo.createMany(connId, scopes);

          if (req.settingsDraft) {
            yield* settingsRepo.create(connId, req.settingsDraft, 1);
          }

          yield* installationRepo.updateStatus(installationId, "approved");

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
