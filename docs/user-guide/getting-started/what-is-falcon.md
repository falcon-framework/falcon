# What is Falcon?

Falcon is a self-hosted platform for two closely related problems:

1. **Falcon Auth** — A centralized identity service (similar in _shape_ to Clerk or Auth0’s hosted experience). Your applications send users to Falcon to sign in or sign up; after authentication, users return to your app with a session that is anchored on the auth service.
2. **Falcon Connect** — A connection layer between **registered applications** inside an **organization**. It models which app may access which other app, under which **scopes** (capabilities), and supports an explicit **request and approval** flow before access is granted.

You typically run:

- An **auth server** (Falcon Auth HTTP API and hosted sign-in pages).
- A **connect service** (Falcon Connect HTTP API).
- A **console** web app where users manage their profile, see which apps they have used, work with **organizations**, and inspect **connections**.

Client applications embed the **Falcon SDK** (for React and server helpers) and configure a **publishable key** so Falcon knows which registered app is calling.

## Who this guide is for

| Audience                              | What you need from Falcon                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **End users**                         | Sign in once with Falcon, use integrated products, manage account and orgs in the console.         |
| **Integrators / frontend developers** | Add sign-in, session checks, and (optionally) Connect API calls from your app.                     |
| **Backend developers**                | Verify sessions, call Connect with correct headers, enforce org and role rules in your own APIs.   |
| **Operators / platform admins**       | Deploy services, configure CORS and URLs, seed or migrate database rows for apps and capabilities. |

## Core terminology

| Term                                    | Meaning                                                                                                                                                                                  |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth server**                         | HTTP service exposing Better Auth–compatible routes (for example `/api/auth/*`) and Falcon’s hosted sign-in UI (`/auth/authorize`, `/auth/sign-up`).                                   |
| **Connect service**                     | HTTP service exposing the Falcon Connect API under a `/v1` prefix.                                                                                                                       |
| **Console**                             | First-party web UI for account, orgs, connected auth apps, and (when configured) connections.                                                                                            |
| **Publishable key** (`pk_…`)            | Public identifier for a **Falcon Auth client app**. Sent on requests (for example `X-Falcon-App-Id`) so the auth server can apply the right CORS, trusted origins, and user–app linking. |
| **Falcon Auth app** (`falcon_auth_app`) | A row registering a client application: allowed browser origins, allowed post-login redirect URLs, publishable key.                                                                      |
| **Falcon Connect app** (`falcon_app`)   | A product registered for Connect: slug, name, status, and linked **capabilities** (scopes).                                                                                              |
| **Organization**                        | A tenant boundary for Connect (and org membership in Auth). Connect data is scoped by organization.                                                                                      |
| **Installation request**                | A proposal to connect a **source** app to a **target** app with a set of requested scopes, pending approval.                                                                             |
| **Connection**                          | An approved, durable link between two apps for one organization, with granted scopes and lifecycle (active, paused, revoked).                                                            |
| **Scope / capability**                  | A string key (for example `demo.read`) declared on a target app; connections grant a subset of these to a source app.                                                                    |

## Falcon Auth vs Falcon Connect

- **Auth** answers: _Who is this user?_ Sessions and users live in the auth database; cookies for the session are set on the auth server’s origin (with appropriate cross-site settings for embedded API calls from your app’s origin).
- **Connect** answers: _May this organization’s installation allow app A to act on app B under scope S?_ It does not replace Auth; it relies on knowing the **user** and **organization** for each API call.

Together they support patterns such as: sign in with Falcon, pick an organization, then create or approve a connection between two products your company uses.

## Next steps

- [Architecture](architecture.md) — how services talk to each other and to the database.
- [Falcon Auth overview](../falcon-auth/README.md) or [Falcon Connect overview](../falcon-connect/README.md) depending on your goal.
