import { connectionSetting } from "@falcon-framework/db/schema/connection";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type SettingsRow = typeof connectionSetting.$inferSelect;

export interface SettingsRepositoryService {
  create(
    connectionId: string,
    settings: unknown,
    version: number,
  ): Effect.Effect<SettingsRow, DatabaseError>;
  findByConnection(
    connectionId: string,
  ): Effect.Effect<SettingsRow | undefined, DatabaseError>;
}

export class SettingsRepository extends Context.Tag(
  "@falcon-framework/connection/SettingsRepository",
)<SettingsRepository, SettingsRepositoryService>() {}

export const SettingsRepositoryLive = Layer.effect(
  SettingsRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      create: (connectionId: string, settings: unknown, version: number) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(connectionSetting)
              .values({
                id: `settings_${connectionId}_${Date.now()}`,
                connectionId,
                settings,
                version,
              })
              .returning()
              .then((rows) => rows[0]!),
          catch: (e) =>
            new DatabaseError({ message: "Failed to create settings", cause: e }),
        }),
      findByConnection: (connectionId: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(connectionSetting)
              .where(eq(connectionSetting.connectionId, connectionId))
              .limit(1)
              .then((rows) => rows[0]),
          catch: (e) =>
            new DatabaseError({ message: "Failed to find settings", cause: e }),
        }),
    };
  }),
);
