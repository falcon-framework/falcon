import { Context, Effect, Layer } from "effect";
import { AuditRepository } from "../repositories/index.js";

export interface AuditServiceService {
  log(
    orgId: string,
    actorUserId: string,
    eventType: string,
    payload: unknown,
  ): Effect.Effect<void, never>;
}

export class AuditService extends Context.Tag("@falcon-framework/connection/AuditService")<
  AuditService,
  AuditServiceService
>() {}

export const AuditServiceLive = Layer.effect(
  AuditService,
  Effect.gen(function* () {
    const auditRepo = yield* AuditRepository;
    return {
      log: (orgId: string, actorUserId: string, eventType: string, payload: unknown) =>
        auditRepo.log(orgId, actorUserId, eventType, payload).pipe(Effect.ignore),
    };
  }),
);
