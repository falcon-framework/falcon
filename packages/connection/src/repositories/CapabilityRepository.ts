import { appCapability } from "@falcon-framework/db/schema/connection";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type CapabilityRow = typeof appCapability.$inferSelect;

export interface CapabilityRepositoryService {
  listByAppId(appId: string): Effect.Effect<CapabilityRow[], DatabaseError>;
}

export class CapabilityRepository extends Context.Tag(
  "@falcon-framework/connection/CapabilityRepository",
)<CapabilityRepository, CapabilityRepositoryService>() {}

export const CapabilityRepositoryLive = Layer.effect(
  CapabilityRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      listByAppId: (appId: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(appCapability)
              .where(eq(appCapability.appId, appId)),
          catch: (e) =>
            new DatabaseError({
              message: "Failed to list capabilities",
              cause: e,
            }),
        }),
    };
  }),
);
