# Falcon Connect concepts

## Falcon Connect app (`falcon_app`)

A **Connect app** is a registered product in the Connect catalog. It has:

- **id** — stable primary key used in APIs (`sourceAppId`, `targetAppId`).
- **slug** — unique short identifier (often used in URLs or logs).
- **name** and **description** — human-facing labels.
- **status** — typically `active` or `inactive` for catalog filtering.

Connect apps are **independent** of **`falcon_auth_app`** rows. In real deployments you might create both for one customer-facing product, but they serve different subsystems.

## Capabilities and scopes

Each Connect app may declare **capabilities** in **`app_capability`**:

- **scope_key** — string identifier (for example `customers.read`, `demo.read`).
- **description** — optional explanation for admins and UIs.

When a **connection** is formed, a subset of these keys is **granted** and stored (for example in **`connection_scope`**). Runtime authorization in _your_ services should treat granted scope keys as the contract of what the source app may request.

## Organization scope

Almost all Connect resources are tied to an **`organization_id`**:

- **Installation requests** belong to one org.
- **Connections** belong to one org.

The Connect API expects the caller to specify which organization they act within using the **`X-Organization-Id`** header. The service then loads the caller’s **membership** for that org and derives their **role** for permission checks.

## Installation request

An **installation request** records intent to connect:

- **source_app_id** — the app initiating access (the “installer” or hub).
- **target_app_id** — the app that will expose data or actions.
- **requested_scopes** — array of scope keys the source wants.
- **status** — `pending`, `approved`, `rejected`, or `expired`.
- **initiated_by_user_id** — who created the request.

Creation is allowed for **owner**, **admin**, and **member** roles by default. Approval is restricted to **owner** and **admin**.

## Connection

A **connection** is the durable outcome after approval (or equivalent automation):

- Links the same **organization**, **source**, and **target** apps.
- Carries **status**: `active`, `paused`, or `revoked`.
- Holds **granted scopes** and optional **settings** snapshots for auditing and product behavior.

Paused connections retain history but should not be used for new operational traffic until **resumed**. Revoked connections are terminal from a permission perspective.

## Settings and audit

The schema supports **per-connection settings** and **audit logs** for traceability (who approved, who revoked, and so on). Product UIs and operators can surface these for compliance and debugging.

## Related topics

- [Installation requests and approval](installation-and-approval.md)
- [Managing connections](managing-connections.md)
- [Permissions matrix](../reference/permissions-matrix.md)
