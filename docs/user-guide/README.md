# Falcon user guide

## PDF and screenshot exports

- **PDFs** of this Markdown guide (per page + one combined file) are under [`export/pdf/`](export/pdf/).
- **PNG screenshots** of the **auth flow in the apps** (demos, hosted Falcon Auth, optional console) are under [`export/screenshots/auth-flow/`](export/screenshots/auth-flow/).

Regenerate everything from [`export/README.md`](export/README.md) with `bun run export` in `docs/user-guide/export/`.

---

This guide explains Falcon for people who **use**, **integrate**, or **operate** the platform: product owners, support, and application developers. It covers Falcon Auth (centralized identity), Falcon Connect (app-to-app connections), the web console, and the JavaScript SDK.

## How to read this guide

- Start with [What is Falcon?](getting-started/what-is-falcon.md) and [Architecture](getting-started/architecture.md) if you are new.
- **Building an app that signs users in?** See [Falcon Auth](falcon-auth/README.md), especially [Centralized sign-in](falcon-auth/centralized-sign-in.md) and [App registration](falcon-auth/app-registration.md).
- **Connecting your product to another Falcon-registered app?** See [Falcon Connect](falcon-connect/README.md).
- **End users in the browser?** See [Using the console](console/README.md).

## Contents

### Getting started

| Document                                             | Description                              |
| ---------------------------------------------------- | ---------------------------------------- |
| [What is Falcon?](getting-started/what-is-falcon.md) | Products, audiences, and terminology     |
| [Architecture](getting-started/architecture.md)      | Services, data stores, and request flows |

### Falcon Auth

| Document                                                    | Description                              |
| ----------------------------------------------------------- | ---------------------------------------- |
| [Falcon Auth overview](falcon-auth/README.md)               | Section index                            |
| [Centralized sign-in](falcon-auth/centralized-sign-in.md)   | Hosted UI, redirects, and return URLs    |
| [Registering client apps](falcon-auth/app-registration.md)  | Database registration, origins, and keys |
| [Sessions and cookies](falcon-auth/sessions-and-cookies.md) | How sessions work across apps            |
| [Organizations](falcon-auth/organizations.md)               | Orgs, members, and Better Auth plugin    |

### Falcon Connect

| Document                                                                          | Description                             |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| [Falcon Connect overview](falcon-connect/README.md)                               | Section index                           |
| [Concepts](falcon-connect/concepts.md)                                            | Apps, capabilities, scopes, org context |
| [Installation requests and approval](falcon-connect/installation-and-approval.md) | End-to-end connection flow              |
| [Managing connections](falcon-connect/managing-connections.md)                    | Status, pause, resume, revoke, sync     |
| [Calling the Connect API](falcon-connect/authentication.md)                       | Headers, session vs JWT, organizations  |

### Console

| Document                                                            | Description                         |
| ------------------------------------------------------------------- | ----------------------------------- |
| [Console overview](console/README.md)                               | Section index                       |
| [Account, profile, and connected apps](console/account-and-apps.md) | User-facing console features        |
| [Organizations in the console](console/organizations.md)            | Creating orgs and switching context |
| [Connections in the console](console/connections.md)                | Viewing and managing connections    |

### SDK and integration

| Document                                                       | Description                                 |
| -------------------------------------------------------------- | ------------------------------------------- |
| [SDK overview](sdk/README.md)                                  | Section index, entry points, install        |
| [React: provider, hooks, components](sdk/react-integration.md) | `FalconAuthProvider`, hooks, optional UI    |
| [Centralized sign-in URLs](sdk/hosted-sign-in-urls.md)         | `buildSignInUrl` / `redirectToSignIn`, etc. |
| [Auth callback and session](sdk/auth-callback-and-session.md)  | `completeAuthCallback`, session helpers     |
| [Server session verification](sdk/server-verification.md)      | `verifySession` for backends                |
| [Falcon Connect HTTP client](sdk/falcon-connect-client.md)     | `createFalconConnectClient`, Zod validation |
| [Connect display helpers](sdk/connect-helpers.md)              | Labeling helpers for Connect API responses  |
| [SDK: organizations](sdk/organizations.md)                     | Active org, switcher UI, Connect headers    |

### Reference

| Document                                                    | Description                        |
| ----------------------------------------------------------- | ---------------------------------- |
| [Reference overview](reference/README.md)                   | Section index                      |
| [Environment variables](reference/environment-variables.md) | Typical configuration by component |
| [Permissions matrix](reference/permissions-matrix.md)       | Connect actions by org role        |

---

Documentation version: aligned with the repository’s Falcon Auth hosted flow, Connect API v1, and console features. For low-level API schemas, see the generated OpenAPI or RPC reference where your deployment exposes it.
