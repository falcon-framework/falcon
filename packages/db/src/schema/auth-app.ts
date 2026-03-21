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

/**
 * Short-lived authorization codes issued after a user signs in on the Falcon Auth
 * server as part of the OAuth-like redirect flow. The client app exchanges the code
 * for a session token via POST /auth/token.
 */
export const authorizationCode = pgTable("authorization_code", {
  id: text("id").primaryKey(),
  /** Opaque random code sent to the client app in the redirect URI. */
  code: text("code").notNull().unique(),
  /** The app that initiated the authorization request. */
  appId: text("app_id")
    .notNull()
    .references(() => falconAuthApp.id, { onDelete: "cascade" }),
  /** The Better-Auth session token that was created when the user signed in. */
  sessionToken: text("session_token").notNull(),
  /** The redirect URI the code will be delivered to (must match the original request). */
  redirectUri: text("redirect_uri").notNull(),
  /** Optional opaque value supplied by the client for CSRF protection. */
  state: text("state"),
  /** Code expires 5 minutes after issuance. */
  expiresAt: timestamp("expires_at").notNull(),
  /** Set when the code has been successfully exchanged. Codes are single-use. */
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const falconAuthAppRelations = relations(falconAuthApp, ({ many }) => ({
  appUsers: many(appUser),
  authorizationCodes: many(authorizationCode),
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

export const authorizationCodeRelations = relations(authorizationCode, ({ one }) => ({
  app: one(falconAuthApp, {
    fields: [authorizationCode.appId],
    references: [falconAuthApp.id],
  }),
}));
