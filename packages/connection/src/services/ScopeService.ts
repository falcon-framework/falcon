import { canCheckScope } from "@falcon-framework/auth";
import { Context, Effect, Layer } from "effect";
import { ForbiddenError, NotFoundError, type DatabaseError } from "../errors.js";
import { ConnectionRepository, ScopeRepository } from "../repositories/index.js";
import type { Principal } from "../principal.js";

export interface ScopeServiceService {
  checkScope(
    principal: Principal,
    connectionId: string,
    appId: string,
    scope: string,
  ): Effect.Effect<boolean, ForbiddenError | NotFoundError | DatabaseError>;
}

export class ScopeService extends Context.Tag("@falcon-framework/connection/ScopeService")<
  ScopeService,
  ScopeServiceService
>() {}

export const ScopeServiceLive = Layer.effect(
  ScopeService,
  Effect.gen(function* () {
    const connectionRepo = yield* ConnectionRepository;
    const scopeRepo = yield* ScopeRepository;

    return {
      checkScope: (principal: Principal, connectionId: string, appId: string, scope: string) =>
        Effect.gen(function* () {
          if (!canCheckScope(principal.role)) {
            yield* new ForbiddenError({
              reason: "Insufficient role to check scope",
            });
          }

          const conn = yield* connectionRepo.findById(connectionId, principal.organizationId);
          if (!conn) {
            yield* new NotFoundError({
              resource: "connection",
              id: connectionId,
            });
            return false as never;
          }

          // Verify the requesting appId is actually a party in this connection
          if (conn.sourceAppId !== appId && conn.targetAppId !== appId) {
            yield* new ForbiddenError({
              reason: `App '${appId}' is not a party to connection '${connectionId}'`,
            });
          }

          const scopeRow = yield* scopeRepo.findScope(connectionId, scope);
          return scopeRow !== undefined;
        }),
    };
  }),
);
