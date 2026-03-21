# Environment variables (reference)

Exact names depend on your deployment (Cloudflare Workers bindings, Vite `import.meta.env`, etc.). This page lists **conceptual** variables used across the default apps in this repository.

## Auth server

| Variable                 | Role                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| **`DATABASE_URL`**       | PostgreSQL connection for Better Auth and Falcon tables.                                              |
| **`BETTER_AUTH_SECRET`** | Signing secret for Better Auth.                                                                       |
| **`BETTER_AUTH_URL`**    | Public base URL of the auth server (used as Better Auth `baseURL` and to derive trusted auth origin). |
| **`CORS_ORIGIN`**        | Allowed origin(s) for the console and related first-party apps; may be comma-separated.               |

## Connect service

| Variable              | Role                                                          |
| --------------------- | ------------------------------------------------------------- |
| **`DATABASE_URL`**    | Same Postgres; Connect uses connection schema tables.         |
| **`BETTER_AUTH_URL`** | Used to call `get-session` and JWKS for principal resolution. |
| **`CORS_ORIGIN`**     | Comma-separated allowed browser origins for the Connect API.  |

## Console (Vite)

Typical `VITE_*` values include:

| Variable                | Role                                                           |
| ----------------------- | -------------------------------------------------------------- |
| **`VITE_SERVER_URL`**   | Falcon Auth server URL used by the console SPA.                |
| Other app-specific URLs | Connect base URL if the console exposes connection management. |

## Demo applications (Vite)

Demos use variables such as:

| Variable                                          | Role                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| **`VITE_FALCON_AUTH_URL`**                        | Auth server base URL.                                                   |
| **`VITE_FALCON_PUBLISHABLE_KEY`**                 | Publishable key for the demo’s `falcon_auth_app` row.                   |
| **`VITE_CONNECT_URL`**                            | Connect service base (without `/v1`).                                   |
| **`VITE_FALCON_APP_ID`** / **`VITE_PEER_APP_ID`** | Connect `falcon_app` ids for source/target demos.                       |
| **`VITE_PEER_APP_ORIGIN`**                        | Trusted peer origin for `returnUrl` validation in cross-app redirects.  |
| **`VITE_APP_PUBLIC_ORIGIN`**                      | This demo’s public origin (used to build hosted `redirect_uri` values). |
| **`VITE_FALCON_CONSOLE_URL`**                     | Link out to the console.                                                |

See each app’s **`.env.example`** for the authoritative list.

## Related topics

- [Architecture](../getting-started/architecture.md)
- [App registration](../falcon-auth/app-registration.md)
