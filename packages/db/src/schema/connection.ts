import { relations } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const falconApp = pgTable("falcon_app", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const appCapability = pgTable(
  "app_capability",
  {
    id: text("id").primaryKey(),
    appId: text("app_id")
      .notNull()
      .references(() => falconApp.id, { onDelete: "cascade" }),
    scopeKey: text("scope_key").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("app_capability_appId_idx").on(table.appId),
    unique("app_capability_appId_scopeKey_unique").on(table.appId, table.scopeKey),
  ],
);

export const installationRequest = pgTable(
  "installation_request",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    sourceAppId: text("source_app_id")
      .notNull()
      .references(() => falconApp.id),
    targetAppId: text("target_app_id")
      .notNull()
      .references(() => falconApp.id),
    requestedScopes: jsonb("requested_scopes").notNull(),
    settingsDraft: jsonb("settings_draft"),
    status: text("status").notNull().default("pending"),
    initiatedByUserId: text("initiated_by_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("installation_request_organizationId_idx").on(table.organizationId)],
);

export const connection = pgTable(
  "connection",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    sourceAppId: text("source_app_id")
      .notNull()
      .references(() => falconApp.id),
    targetAppId: text("target_app_id")
      .notNull()
      .references(() => falconApp.id),
    installationRequestId: text("installation_request_id").references(() => installationRequest.id),
    status: text("status").notNull().default("active"),
    createdByUserId: text("created_by_user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("connection_organizationId_idx").on(table.organizationId)],
);

export const connectionScope = pgTable("connection_scope", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id")
    .notNull()
    .references(() => connection.id, { onDelete: "cascade" }),
  scopeKey: text("scope_key").notNull(),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});

export const connectionScopeRelations = relations(connectionScope, ({ one }) => ({
  connection: one(connection, {
    fields: [connectionScope.connectionId],
    references: [connection.id],
  }),
}));

export const connectionSetting = pgTable("connection_setting", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id")
    .notNull()
    .references(() => connection.id, { onDelete: "cascade" }),
  settings: jsonb("settings").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const connectionAuditLog = pgTable(
  "connection_audit_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    actorUserId: text("actor_user_id").notNull(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("connection_audit_log_organizationId_idx").on(table.organizationId)],
);

export const syncJob = pgTable(
  "sync_job",
  {
    id: text("id").primaryKey(),
    connectionId: text("connection_id")
      .notNull()
      .references(() => connection.id),
    status: text("status").notNull().default("requested"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("sync_job_connectionId_idx").on(table.connectionId)],
);

export const falconAppRelations = relations(falconApp, ({ many }) => ({
  capabilities: many(appCapability),
}));

export const appCapabilityRelations = relations(appCapability, ({ one }) => ({
  app: one(falconApp, {
    fields: [appCapability.appId],
    references: [falconApp.id],
  }),
}));

export const installationRequestRelations = relations(installationRequest, ({ one }) => ({
  sourceApp: one(falconApp, {
    fields: [installationRequest.sourceAppId],
    references: [falconApp.id],
  }),
  targetApp: one(falconApp, {
    fields: [installationRequest.targetAppId],
    references: [falconApp.id],
  }),
}));

export const connectionRelations = relations(connection, ({ one, many }) => ({
  sourceApp: one(falconApp, {
    fields: [connection.sourceAppId],
    references: [falconApp.id],
  }),
  targetApp: one(falconApp, {
    fields: [connection.targetAppId],
    references: [falconApp.id],
  }),
  installationRequest: one(installationRequest, {
    fields: [connection.installationRequestId],
    references: [installationRequest.id],
  }),
  scopes: many(connectionScope),
  settings: many(connectionSetting),
  syncJobs: many(syncJob),
}));

export const connectionSettingRelations = relations(connectionSetting, ({ one }) => ({
  connection: one(connection, {
    fields: [connectionSetting.connectionId],
    references: [connection.id],
  }),
}));

export const syncJobRelations = relations(syncJob, ({ one }) => ({
  connection: one(connection, {
    fields: [syncJob.connectionId],
    references: [connection.id],
  }),
}));
