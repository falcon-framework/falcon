import { canRevokeOrPauseConnection } from "@falcon-framework/auth";
import { Context, Effect, Layer } from "effect";
import {
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  type DatabaseError,
} from "../errors.js";
import {
  ConnectionRepository,
  type ConnectionRow,
  ScopeRepository,
  SettingsRepository,
} from "../repositories/index.js";
import { AuditService } from "./AuditService.js";
import type { Principal } from "../principal.js";

export type ConnectionDetailData = ConnectionRow & {
  scopes: string[];
  settings: Record<string, unknown> | null;
};

export interface ConnectionServiceService {
  list(principal: Principal): Effect.Effect<ConnectionRow[], DatabaseError>;
  getDetail(
    principal: Principal,
    connectionId: string,
  ): Effect.Effect<ConnectionDetailData, NotFoundError | DatabaseError>;
  revoke(
    principal: Principal,
    connectionId: string,
  ): Effect.Effect<ConnectionRow, ForbiddenError | NotFoundError | DatabaseError>;
  pause(
    principal: Principal,
    connectionId: string,
  ): Effect.Effect<ConnectionRow, ForbiddenError | NotFoundError | DatabaseError>;
  resume(
    principal: Principal,
    connectionId: string,
  ): Effect.Effect<
    ConnectionRow,
    ForbiddenError | NotFoundError | InvalidStateError | DatabaseError
  >;
}

export class ConnectionService extends Context.Tag(
  "@falcon-framework/connection/ConnectionService",
)<ConnectionService, ConnectionServiceService>() {}

export const ConnectionServiceLive = Layer.effect(
  ConnectionService,
  Effect.gen(function* () {
    const connectionRepo = yield* ConnectionRepository;
    const scopeRepo = yield* ScopeRepository;
    const settingsRepo = yield* SettingsRepository;
    const auditService = yield* AuditService;

    const requireConnection = (principal: Principal, connectionId: string) =>
      Effect.gen(function* () {
        const conn = yield* connectionRepo.findById(connectionId, principal.organizationId);
        if (!conn) {
          yield* new NotFoundError({ resource: "connection", id: connectionId });
          return undefined as never;
        }
        return conn;
      });

    return {
      list: (principal: Principal) => connectionRepo.listByOrganization(principal.organizationId),

      getDetail: (principal: Principal, connectionId: string) =>
        Effect.gen(function* () {
          const conn = yield* requireConnection(principal, connectionId);
          const scopeRows = yield* scopeRepo.listByConnection(connectionId);
          const settingsRow = yield* settingsRepo.findByConnection(connectionId);
          return {
            ...conn,
            scopes: scopeRows.map((s) => s.scopeKey),
            settings: settingsRow ? (settingsRow.settings as Record<string, unknown>) : null,
          };
        }),

      revoke: (principal: Principal, connectionId: string) =>
        Effect.gen(function* () {
          if (!canRevokeOrPauseConnection(principal.role)) {
            yield* new ForbiddenError({
              reason: "Insufficient role to revoke connection",
            });
          }
          yield* requireConnection(principal, connectionId);
          const conn = yield* connectionRepo.updateStatus(
            connectionId,
            principal.organizationId,
            "revoked",
          );
          yield* auditService.log(
            principal.organizationId,
            principal.userId,
            "connection.revoked",
            { connectionId },
          );
          return conn;
        }),

      pause: (principal: Principal, connectionId: string) =>
        Effect.gen(function* () {
          if (!canRevokeOrPauseConnection(principal.role)) {
            yield* new ForbiddenError({
              reason: "Insufficient role to pause connection",
            });
          }
          yield* requireConnection(principal, connectionId);
          const conn = yield* connectionRepo.updateStatus(
            connectionId,
            principal.organizationId,
            "paused",
          );
          yield* auditService.log(principal.organizationId, principal.userId, "connection.paused", {
            connectionId,
          });
          return conn;
        }),

      resume: (principal: Principal, connectionId: string) =>
        Effect.gen(function* () {
          if (!canRevokeOrPauseConnection(principal.role)) {
            return yield* new ForbiddenError({
              reason: "Insufficient role to resume connection",
            });
          }
          const conn = yield* requireConnection(principal, connectionId);
          if (conn.status !== "paused") {
            return yield* new InvalidStateError({
              resource: "connection",
              currentStatus: conn.status,
              requiredStatus: "paused",
            });
          }
          const updated = yield* connectionRepo.updateStatus(
            connectionId,
            principal.organizationId,
            "active",
          );
          yield* auditService.log(
            principal.organizationId,
            principal.userId,
            "connection.resumed",
            { connectionId },
          );
          return updated;
        }),
    };
  }),
);
