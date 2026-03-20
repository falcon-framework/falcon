import { db as _db } from "@falcon-framework/db";
import { Context, Layer } from "effect";

// Use the concrete inferred type from the db package export
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = typeof _db;

export class DbService extends Context.Tag(
  "@falcon-framework/connection/DbService",
)<DbService, Db>() {}

export const DbServiceLive: Layer.Layer<DbService> = Layer.succeed(
  DbService,
  _db as Db,
);
