import type { Db } from "../Db.js";
import { dbLayer } from "../Db.js";
import { Layer } from "effect";
import { makeRepositoriesLive } from "../repositories/index.js";
import { AppServiceLive } from "./AppService.js";
import { AuditServiceLive } from "./AuditService.js";
import { ConnectionServiceLive } from "./ConnectionService.js";
import { InstallationServiceLive } from "./InstallationService.js";
import { ScopeServiceLive } from "./ScopeService.js";
import { SyncServiceLive } from "./SyncService.js";

export * from "./AppService.js";
export * from "./AuditService.js";
export * from "./ConnectionService.js";
export * from "./InstallationService.js";
export * from "./ScopeService.js";
export * from "./SyncService.js";

export function makeServicesLive(db: Db) {
  const d = dbLayer(db);
  // InstallationService needs AuditService AND DbService (for the transaction)
  const InstallationServiceWithDeps = InstallationServiceLive.pipe(
    Layer.provide(AuditServiceLive),
    Layer.provide(d),
  );
  const ConnectionServiceWithAudit = ConnectionServiceLive.pipe(Layer.provide(AuditServiceLive));
  const SyncServiceWithAudit = SyncServiceLive.pipe(Layer.provide(AuditServiceLive));

  return Layer.mergeAll(
    AuditServiceLive,
    AppServiceLive,
    InstallationServiceWithDeps,
    ConnectionServiceWithAudit,
    ScopeServiceLive,
    SyncServiceWithAudit,
  ).pipe(Layer.provide(makeRepositoriesLive(db)));
}
