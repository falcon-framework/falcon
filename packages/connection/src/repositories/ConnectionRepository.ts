import { connection } from "@falcon-framework/db/schema/connection";
import { and, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { DbService } from "../Db.js";
import { DatabaseError } from "../errors.js";

export type ConnectionRow = typeof connection.$inferSelect;

export type CreateConnectionData = {
  id: string;
  organizationId: string;
  sourceAppId: string;
  targetAppId: string;
  installationRequestId: string;
  createdByUserId: string;
};

export interface ConnectionRepositoryService {
  create(data: CreateConnectionData): Effect.Effect<ConnectionRow, DatabaseError>;
  findById(id: string, orgId: string): Effect.Effect<ConnectionRow | undefined, DatabaseError>;
  listByOrganization(orgId: string): Effect.Effect<ConnectionRow[], DatabaseError>;
  updateStatus(
    id: string,
    orgId: string,
    status: string,
  ): Effect.Effect<ConnectionRow, DatabaseError>;
  findDuplicate(
    orgId: string,
    sourceAppId: string,
    targetAppId: string,
  ): Effect.Effect<ConnectionRow | undefined, DatabaseError>;
}

export class ConnectionRepository extends Context.Tag(
  "@falcon-framework/connection/ConnectionRepository",
)<ConnectionRepository, ConnectionRepositoryService>() {}

export const ConnectionRepositoryLive = Layer.effect(
  ConnectionRepository,
  Effect.gen(function* () {
    const db = yield* DbService;
    return {
      create: (data: CreateConnectionData) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(connection)
              .values({
                id: data.id,
                organizationId: data.organizationId,
                sourceAppId: data.sourceAppId,
                targetAppId: data.targetAppId,
                installationRequestId: data.installationRequestId,
                createdByUserId: data.createdByUserId,
                status: "active",
              })
              .returning()
              .then((rows) => rows[0]!),
          catch: (e) => new DatabaseError({ message: "Failed to create connection", cause: e }),
        }),
      findById: (id: string, orgId: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(connection)
              .where(and(eq(connection.id, id), eq(connection.organizationId, orgId)))
              .limit(1)
              .then((rows) => rows[0]),
          catch: (e) => new DatabaseError({ message: "Failed to find connection", cause: e }),
        }),
      listByOrganization: (orgId: string) =>
        Effect.tryPromise({
          try: () => db.select().from(connection).where(eq(connection.organizationId, orgId)),
          catch: (e) => new DatabaseError({ message: "Failed to list connections", cause: e }),
        }),
      updateStatus: (id: string, orgId: string, status: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .update(connection)
              .set({ status, updatedAt: new Date() })
              .where(and(eq(connection.id, id), eq(connection.organizationId, orgId)))
              .returning()
              .then((rows) => rows[0]!),
          catch: (e) =>
            new DatabaseError({ message: "Failed to update connection status", cause: e }),
        }),
      findDuplicate: (orgId: string, sourceAppId: string, targetAppId: string) =>
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(connection)
              .where(
                and(
                  eq(connection.organizationId, orgId),
                  eq(connection.sourceAppId, sourceAppId),
                  eq(connection.targetAppId, targetAppId),
                  eq(connection.status, "active"),
                ),
              )
              .limit(1)
              .then((rows) => rows[0]),
          catch: (e) =>
            new DatabaseError({ message: "Failed to check duplicate connection", cause: e }),
        }),
    };
  }),
);
