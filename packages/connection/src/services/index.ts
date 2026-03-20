import { Layer } from "effect";
import { DbServiceLive } from "../Db.js";
import { RepositoriesLive } from "../repositories/index.js";
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

// Services that need AuditService must have it explicitly provided
// InstallationService needs AuditService AND DbService (for the transaction)
const InstallationServiceWithDeps = InstallationServiceLive.pipe(
  Layer.provide(AuditServiceLive),
  Layer.provide(DbServiceLive),
);
const ConnectionServiceWithAudit = ConnectionServiceLive.pipe(Layer.provide(AuditServiceLive));
const SyncServiceWithAudit = SyncServiceLive.pipe(Layer.provide(AuditServiceLive));

export const ServicesLive = Layer.mergeAll(
  AuditServiceLive,
  AppServiceLive,
  InstallationServiceWithDeps,
  ConnectionServiceWithAudit,
  ScopeServiceLive,
  SyncServiceWithAudit,
).pipe(Layer.provide(RepositoriesLive));
