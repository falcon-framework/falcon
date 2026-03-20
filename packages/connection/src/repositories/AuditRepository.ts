import { connectionAuditLog } from "@falcon-framework/db/schema/connection";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export interface AuditRepositoryService {
  log(
    orgId: string,
    actorUserId: string,
    eventType: string,
    payload: unknown,
  ): Effect.Effect<void, DatabaseError>;
}

export class AuditRepository extends Context.Tag(
  "@falcon-framework/connection/AuditRepository",
)<AuditRepository, AuditRepositoryService>() {}

export const AuditRepositoryLive = Layer.effect(
  AuditRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      log: (
        orgId: string,
        actorUserId: string,
        eventType: string,
        payload: unknown,
      ) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(connectionAuditLog)
              .values({
                id: `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                organizationId: orgId,
                actorUserId,
                eventType,
                payload,
              })
              .then(() => undefined),
          catch: (e) =>
            new DatabaseError({ message: "Failed to write audit log", cause: e }),
        }),
    };
  }),
);
