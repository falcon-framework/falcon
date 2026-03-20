import { syncJob } from "@falcon-framework/db/schema/connection";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type SyncJobRow = typeof syncJob.$inferSelect;

export interface SyncJobRepositoryService {
  create(connectionId: string): Effect.Effect<SyncJobRow, DatabaseError>;
  findById(id: string): Effect.Effect<SyncJobRow | undefined, DatabaseError>;
}

export class SyncJobRepository extends Context.Tag(
  "@falcon-framework/connection/SyncJobRepository",
)<SyncJobRepository, SyncJobRepositoryService>() {}

export const SyncJobRepositoryLive = Layer.effect(
  SyncJobRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      create: (connectionId: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(syncJob)
              .values({
                id: `sync_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                connectionId,
                status: "requested",
              })
              .returning()
              .then((rows) => rows[0]!),
          catch: (e) =>
            new DatabaseError({ message: "Failed to create sync job", cause: e }),
        }),
      findById: (id: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(syncJob)
              .where(eq(syncJob.id, id))
              .limit(1)
              .then((rows) => rows[0]),
          catch: (e) =>
            new DatabaseError({ message: "Failed to find sync job", cause: e }),
        }),
    };
  }),
);
