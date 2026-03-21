import { relations } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * Registered external applications that use Falcon Auth as their identity provider.
 *
 * Apps are inserted manually into the database. Each app gets a publishable key
 * (embedded in frontend code) used to identify the app in SDK requests.
 */
export const falconAuthApp = pgTable("falcon_auth_app", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  /** JSON array of allowed CORS origins, e.g. ["https://myapp.com", "http://localhost:3000"] */
  allowedOrigins: jsonb("allowed_origins").notNull().$type<string[]>().default([]),
  /** JSON array of allowed redirect URLs after authentication */
  redirectUrls: jsonb("redirect_urls").notNull().$type<string[]>().default([]),
  /** Public key embedded in frontend code, e.g. "pk_live_abc123" */
  publishableKey: text("publishable_key").notNull().unique(),
  /** PBKDF2-hashed secret key for server-side verification */
  secretKeyHash: text("secret_key_hash"),
  /** Per-app settings (enabled auth methods, branding overrides, etc.) */
  settings: jsonb("settings").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Links users to the external apps they signed up through.
 * A user can exist across multiple apps.
 */
export const appUser = pgTable(
  "app_user",
  {
    id: text("id").primaryKey(),
    appId: text("app_id")
      .notNull()
      .references(() => falconAuthApp.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("app_user_appId_userId_unique").on(table.appId, table.userId),
    index("app_user_appId_idx").on(table.appId),
    index("app_user_userId_idx").on(table.userId),
  ],
);

export const falconAuthAppRelations = relations(falconAuthApp, ({ many }) => ({
  appUsers: many(appUser),
}));

export const appUserRelations = relations(appUser, ({ one }) => ({
  app: one(falconAuthApp, {
    fields: [appUser.appId],
    references: [falconAuthApp.id],
  }),
  user: one(user, {
    fields: [appUser.userId],
    references: [user.id],
  }),
}));
