import { falconApp } from "@falcon-framework/db/schema/connection";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type AppRow = typeof falconApp.$inferSelect;

export interface AppRepositoryService {
  listActive(): Effect.Effect<AppRow[], DatabaseError>;
  findById(id: string): Effect.Effect<AppRow | undefined, DatabaseError>;
}

export class AppRepository extends Context.Tag("@falcon-framework/connection/AppRepository")<
  AppRepository,
  AppRepositoryService
>() {}

export const AppRepositoryLive = Layer.effect(
  AppRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      listActive: () => {
        return Effect.tryPromise({
          try: async () => {
            const apps = await db.select().from(falconApp).where(eq(falconApp.status, "active"));
            return apps;
          },
          catch: (e) => new DatabaseError({ message: "Failed to list apps", cause: e }),
        });
      },
      findById: (id: string) => {
        return Effect.tryPromise({
          try: () => {
            return db
              .select()
              .from(falconApp)
              .where(eq(falconApp.id, id))
              .limit(1)
              .then((rows) => rows[0]);
          },
          catch: (e) => new DatabaseError({ message: "Failed to find app", cause: e }),
        });
      },
    };
  }),
);
