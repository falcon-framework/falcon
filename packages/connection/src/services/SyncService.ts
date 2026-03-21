import { Context, Effect, Layer } from "effect";
import { ForbiddenError, NotFoundError, type DatabaseError } from "../errors.js";
import { ConnectionRepository, SyncJobRepository, type SyncJobRow } from "../repositories/index.js";
import { AuditService } from "./AuditService.js";
import type { Principal } from "../principal.js";

export interface SyncServiceService {
  triggerSync(
    principal: Principal,
    connectionId: string,
  ): Effect.Effect<SyncJobRow, ForbiddenError | NotFoundError | DatabaseError>;
}

export class SyncService extends Context.Tag("@falcon-framework/connection/SyncService")<
  SyncService,
  SyncServiceService
>() {}

export const SyncServiceLive = Layer.effect(
  SyncService,
  Effect.gen(function* () {
    const connectionRepo = yield* ConnectionRepository;
    const syncJobRepo = yield* SyncJobRepository;
    const auditService = yield* AuditService;

    return {
      triggerSync: (principal: Principal, connectionId: string) =>
        Effect.gen(function* () {
          const conn = yield* connectionRepo.findById(connectionId, principal.organizationId);
          if (!conn) {
            yield* new NotFoundError({
              resource: "connection",
              id: connectionId,
            });
            return undefined as never;
          }

          if (conn.status !== "active") {
            yield* new ForbiddenError({
              reason: `Connection is not active (status: ${conn.status})`,
            });
          }

          const job = yield* syncJobRepo.create(connectionId);

          yield* auditService.log(
            principal.organizationId,
            principal.userId,
            "connection.sync_triggered",
            { connectionId, syncJobId: job.id },
          );

          return job;
        }),
    };
  }),
);
