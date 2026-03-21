# Registering Falcon Auth client apps

Every application that uses Falcon Auth as its identity provider must be registered in the database table **`falcon_auth_app`**. Registration is **operator-driven** (SQL seed, migration, or admin tooling); there is no requirement for a self-service developer portal in the default stack.

## What a registration defines

| Field (logical) | Purpose |
| --------------- | ------- |
| **id** | Stable primary key for the row (text). |
| **name** | Human-readable name (shown on hosted sign-in). |
| **publishable_key** | Public identifier, conventionally `pk_…`. Embedded in frontend config and sent as **`X-Falcon-App-Id`**. |
| **allowed_origins** | JSON array of origins (for example `["https://app.example.com"]`) that may call the auth API with this key. Used for CORS on the auth server and for Better Auth **trusted origins** when this app is in play. |
| **redirect_urls** | JSON array of **full URLs** allowed as `redirect_uri` for **hosted** sign-in and sign-up. Matching is **exact**. |
| **secret_key_hash** | Optional server-side secret storage for future flows (may be null in demos). |
| **settings** | Optional JSON for future per-app configuration. |

## Linking users to apps

When requests include **`X-Falcon-App-Id`**, the auth layer can associate sign-ups and sessions with the corresponding **`falcon_auth_app`** so you know **which products** a user has used. The console’s “connected apps” style UI reads this association.

## Relationship to Falcon Connect apps

**Important:** `falcon_auth_app` and **`falcon_app`** (Connect) are different tables.

- **Auth app** — “This SPA or mobile shell uses Falcon to sign users in.”
- **Connect app** — “This product participates in installation requests and connections.”

A single product in your portfolio might have **both** rows (same company branding, different ids and keys). Demo projects use distinct ids for source/target Connect apps and separate Auth publishable keys.

## Example seed snippet

Your repository may ship SQL similar to:

```sql
INSERT INTO falcon_auth_app (id, name, allowed_origins, redirect_urls, publishable_key, …)
VALUES (
  'my-app-auth',
  'My Customer Portal',
  '["https://portal.example.com"]'::jsonb,
  '["https://portal.example.com/after-login"]'::jsonb,
  'pk_live_abc123',
  …
);
```

Adjust origins and redirect URLs for each environment (development, staging, production).

## Checklist for a new SPA

1. Create **`falcon_auth_app`** row with **publishable key** you will put in frontend env (for example `VITE_FALCON_PUBLISHABLE_KEY`).
2. Add **every browser origin** your SPA uses to **`allowed_origins`** (local dev ports count).
3. Add **every post-login URL** you pass as `redirect_uri` to **`redirect_urls`**.
4. Point **`VITE_FALCON_AUTH_URL`** (or equivalent) at your auth server’s public base URL.
5. Ensure **CORS** on the auth server allows your origin when the publishable key header is present (handled automatically when registration is correct).

## Related topics

- [Centralized sign-in](centralized-sign-in.md)
- [Sessions and cookies](sessions-and-cookies.md)
- [Environment variables](../reference/environment-variables.md)
