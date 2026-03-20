import { connectionScope } from "@falcon-framework/db/schema/connection";
import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type ScopeRow = typeof connectionScope.$inferSelect;

export interface ScopeRepositoryService {
  createMany(
    connectionId: string,
    scopes: string[],
  ): Effect.Effect<void, DatabaseError>;
  listByConnection(
    connectionId: string,
  ): Effect.Effect<ScopeRow[], DatabaseError>;
  findScope(
    connectionId: string,
    scopeKey: string,
  ): Effect.Effect<ScopeRow | undefined, DatabaseError>;
}

export class ScopeRepository extends Context.Tag(
  "@falcon-framework/connection/ScopeRepository",
)<ScopeRepository, ScopeRepositoryService>() {}

export const ScopeRepositoryLive = Layer.effect(
  ScopeRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      createMany: (connectionId: string, scopes: string[]) =>
        Effect.tryPromise({
          try: () =>
            scopes.length === 0
              ? Promise.resolve()
              : db
                  .insert(connectionScope)
                  .values(
                    scopes.map((scopeKey, i) => ({
                      id: `scope_${connectionId}_${i}_${Date.now()}`,
                      connectionId,
                      scopeKey,
                    })),
                  )
                  .then(() => undefined),
          catch: (e) =>
            new DatabaseError({ message: "Failed to create scopes", cause: e }),
        }),
      listByConnection: (connectionId: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(connectionScope)
              .where(eq(connectionScope.connectionId, connectionId)),
          catch: (e) =>
            new DatabaseError({ message: "Failed to list scopes", cause: e }),
        }),
      findScope: (connectionId: string, scopeKey: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(connectionScope)
              .where(
                and(
                  eq(connectionScope.connectionId, connectionId),
                  eq(connectionScope.scopeKey, scopeKey),
                ),
              )
              .limit(1)
              .then((rows) => rows[0]),
          catch: (e) =>
            new DatabaseError({ message: "Failed to find scope", cause: e }),
        }),
    };
  }),
);
