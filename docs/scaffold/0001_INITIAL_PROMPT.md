
# Project: FALCON — Framework for Application Linking, Communication, Orchestration, and Networking

## Overview

FALCON is an internal platform that enables multiple independently deployed applications to be connected by users in a controlled, permissioned, and auditable way. It's name is an acronym for "Framework for Application Linking, Communication, Orchestration, and Networking".

The system is conceptually similar to OAuth-based app integrations (e.g. “Connect Slack”), but applies only to **first-party applications** within the same ecosystem.

The goal is to allow users to:

* connect one app to another (e.g. CRM ↔ Order Management App ↔ Other apps)
* grant scoped permissions between apps
* configure how data flows between them
* manage and revoke those connections

The platform must be:

* modular
* type-safe (TypeScript)
* cloud-native (Cloudflare Workers)
* scalable across multiple apps
* maintainable long-term

---

## Core Concepts

### 1. Identity (Auth): "auth-server"

A centralized authentication system:

* users sign in once and can access all apps (SSO)
* identity, sessions, and tenants are managed centrally
* the auth system acts as an OAuth/OIDC provider for internal apps

Better Auth helps a lot with the annyoing boilerplate and integration with their great in-house plugins for SSO and OAuth.

---

### 2. Connections: "connection-service"

A **Connection** represents a persistent, user-approved relationship between two (or more) apps.

Example:

* Orders app connects to CRM
* CRM grants `customers.read` and `customers.subscribe`

A connection includes:

* source app
* target app
* tenant mapping
* granted scopes
* configuration (sync rules, mappings)
* lifecycle status

---

### 3. Installation Flow

A connection is created via an **installation flow**:

1. User initiates “Connect App B” from App A
2. System verifies user identity and tenant permissions
3. User selects scopes and configuration
4. System creates a connection record
5. Initial sync may be triggered to exchange info they need in addition to the connection

---

### 4. Scopes & Capabilities

Each app defines capabilities such as:

* `customers.read`
* `orders.write`
* `customers.subscribe`

Connections grant a subset of these as **scopes**.

All cross-app access must be validated against granted scopes.

Formats:

- "<module>.<action>" for more general capabilities
- "<module>.<submodule(s)>.<action>" for more granular capabilities

---

### 5. Data Exchange

Apps remain independent:

* each app owns its own database
* no shared database between apps

Data exchange happens via:

* direct API calls (for synchronous needs)
* event-driven sync (for eventual consistency)
* whatever the way is that apps want to communicate

The connection system only governs **permission and configuration**, not data transport.

---

## Architecture

### Services

#### 1. Auth Service (`auth-server` and packages)

* handles identity, sessions, tokens
* acts as OAuth/OIDC provider
* controls which apps can use this service

#### 2. Connection Service (`connection-service` and packages)

Connection service to implement.

Responsibilities:

* app registry
* installation flow
* connection lifecycle
* scope management
* tenant mapping
* sync triggers
* audit logging

#### 3. App Services

Independent apps (e.g. CRM, Order Management, etc.)

* each has its own API and database, therefore infra-wise completely independent
* integrates with auth server to provide cross-app auth
* integrates with connection service
* enforces scope checks on incoming requests

---

## Tech Stack

* Runtime: Cloudflare Workers
* Language: TypeScript
* Framework: Hono (for APIs)
* Database: PostgreSQL (for connection + auth services)
* Event system: Cloudflare Queues (later)
* Monorepo structure (bun, nx)

These should already be scaffolded. Study the codebase to learn the parts.

---

## Data Model (Connection Service)

Design and implement these core entities:

### apps

Registered first-party apps.

### app_capabilities

Scopes exposed by each app.

### installation_requests

Temporary records during connection setup.

### connections

Persistent relationships between apps.

### connection_scopes

Granted scopes per connection.

### connection_settings

Sync configuration and mappings.

### connection_audit_logs

Lifecycle and security events.

### sync_jobs (optional v1)

Track sync execution state.

---

## API Design

Implement REST APIs in `connection-service`.
Use Effect's HTTP module for that, and integrate it with Hono.

Required endpoints:

### Apps

* `GET /apps`
* `GET /apps/:appId/capabilities`

### Installations

* `POST /installations`
* `POST /installations/:id/approve`

### Connections

* `GET /connections`
* `GET /connections/:id`
* `POST /connections/:id/revoke`
* `POST /connections/:id/pause`

### Scopes

* `POST /connections/:id/check-scope`

### Sync

* `POST /connections/:id/sync`

All endpoints must:

* validate user identity via auth service
* enforce tenant permissions
* return typed responses

---

## Naming Conventions and Localization

The app is targeting German audiences. The language in the applications must be German.
Documentation, except for user-facing docs, must be written in English as usual.

Use clear, enterprise-style naming:

* Use “Verbindung” / "Connection" for persistent relationships
* Use “Installation” for setup flows
* Use “Bereiche” / "Scopes" for permissions
* Use “Erlaubnis” / "Grant" for authorization decisions

---

## Code Structure Guidelines

* separate domain logic from infrastructure - use Effect-TS for implementing high quality dependency injection with clear separation of concerns
* use repositories for DB access (Effect Context and Layers)
* use services for business logic (Effect Context and Layers)
* keep routes thin (controllers only)
* strongly type all inputs/outputs
* do NOT use `any`, `unknown` or similar unless EXPLICITLY at STRONGLY necessary
* use Effect for everything: Schema, service contracts, service implementations, OTel, error management, dependency injection, logging, etc.

---

## Security Requirements

* every request must be authenticated
* every operation must validate tenant ownership
* every cross-app action must check scope grants
* no implicit trust between apps
* only pre-defined apps are allowed to make use of the auth service

---

## Non-Goals

Do NOT implement:

* third-party integrations (Slack, etc.)
* generic iPaaS features
* workflow engine (future concern)
* data synchronization logic inside this service

---

## Deliverables

1. Implement Connection and Auth services
2. Define types and contracts
3. Implement core DB schema
4. Implement API routes
5. Implement domain services
6. Provide validation and error handling
7. Keep code modular and extensible
8. Integrate Audit logging and OTel

---

## Key Principle

This system is **not about data movement**.

It is about:

* **who is allowed to connect which apps**
* **under which permissions**
* **for which tenant**
* **with which configuration**

Keep the system focused on that responsibility.

