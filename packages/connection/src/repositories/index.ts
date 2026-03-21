import type { Db } from "../Db.js";
import { dbLayer } from "../Db.js";
import { Layer } from "effect";
import { AppRepositoryLive } from "./AppRepository.js";
import { AuditRepositoryLive } from "./AuditRepository.js";
import { CapabilityRepositoryLive } from "./CapabilityRepository.js";
import { ConnectionRepositoryLive } from "./ConnectionRepository.js";
import { InstallationRepositoryLive } from "./InstallationRepository.js";
import { ScopeRepositoryLive } from "./ScopeRepository.js";
import { SettingsRepositoryLive } from "./SettingsRepository.js";
import { SyncJobRepositoryLive } from "./SyncJobRepository.js";

export * from "./AppRepository.js";
export * from "./AuditRepository.js";
export * from "./CapabilityRepository.js";
export * from "./ConnectionRepository.js";
export * from "./InstallationRepository.js";
export * from "./ScopeRepository.js";
export * from "./SettingsRepository.js";
export * from "./SyncJobRepository.js";

export const makeRepositoriesLive = (db: Db) =>
  Layer.mergeAll(
    AppRepositoryLive,
    CapabilityRepositoryLive,
    InstallationRepositoryLive,
    ConnectionRepositoryLive,
    ScopeRepositoryLive,
    SettingsRepositoryLive,
    AuditRepositoryLive,
    SyncJobRepositoryLive,
  ).pipe(Layer.provide(dbLayer(db)));
