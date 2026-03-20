import { installationRequest } from "@falcon-framework/db/schema/connection";
import { eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type InstallationRequestRow = typeof installationRequest.$inferSelect;

export type CreateInstallationData = {
  id: string;
  organizationId: string;
  sourceAppId: string;
  targetAppId: string;
  requestedScopes: unknown;
  settingsDraft?: unknown;
  initiatedByUserId: string;
};

export interface InstallationRepositoryService {
  create(data: CreateInstallationData): Effect.Effect<InstallationRequestRow, DatabaseError>;
  findById(id: string): Effect.Effect<InstallationRequestRow | undefined, DatabaseError>;
  updateStatus(id: string, status: string): Effect.Effect<void, DatabaseError>;
}

export class InstallationRepository extends Context.Tag(
  "@falcon-framework/connection/InstallationRepository",
)<InstallationRepository, InstallationRepositoryService>() {}

export const InstallationRepositoryLive = Layer.effect(
  InstallationRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      create: (data: CreateInstallationData) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(installationRequest)
              .values({
                id: data.id,
                organizationId: data.organizationId,
                sourceAppId: data.sourceAppId,
                targetAppId: data.targetAppId,
                requestedScopes: data.requestedScopes,
                settingsDraft: data.settingsDraft ?? null,
                initiatedByUserId: data.initiatedByUserId,
                status: "pending",
              })
              .returning()
              .then((rows) => rows[0]!),
          catch: (e) =>
            new DatabaseError({
              message: "Failed to create installation request",
              cause: e,
            }),
        }),
      findById: (id: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(installationRequest)
              .where(eq(installationRequest.id, id))
              .limit(1)
              .then((rows) => rows[0]),
          catch: (e) =>
            new DatabaseError({
              message: "Failed to find installation request",
              cause: e,
            }),
        }),
      updateStatus: (id: string, status: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .update(installationRequest)
              .set({ status, updatedAt: new Date() })
              .where(eq(installationRequest.id, id))
              .then(() => undefined),
          catch: (e) =>
            new DatabaseError({
              message: "Failed to update installation request status",
              cause: e,
            }),
        }),
    };
  }),
);
