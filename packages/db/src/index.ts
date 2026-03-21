import { env } from "@falcon-framework/env/server";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

// Per-request factory — required for Cloudflare Workers where TCP sockets
// (created by postgres.js via cloudflare:sockets) are bound to the request
// context that first uses them and cannot be reused across requests.
export function makeDb() {
  const client = postgres(env.DATABASE_URL || "", { ssl: false, max: 1 });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof makeDb>;

/** Close the underlying postgres.js client (exposed as `db.$client` by drizzle postgres-js). */
export async function closeDb(db: Db): Promise<void> {
  const client = (db as { $client?: { end?: (opts?: { timeout?: number }) => Promise<void> } })
    .$client;
  if (client?.end) await client.end();
}
