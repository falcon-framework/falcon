import { type Db } from "@falcon-framework/db";
import { Context, Layer } from "effect";

export type { Db };

export class DbService extends Context.Tag("@falcon-framework/connection/DbService")<
  DbService,
  Db
>() {}

/** Provide a DB instance built with `makeDb()` for this HTTP request only (Workers-safe). */
export const dbLayer = (db: Db): Layer.Layer<DbService> => Layer.succeed(DbService, db);
