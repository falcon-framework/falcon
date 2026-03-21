# Managing connections

Once a **connection** exists between a **source** and **target** app for an **organization**, operators and product UIs can manage its lifecycle through the Connect API (and mirrored features in the console when enabled).

## Listing connections

`GET /v1/connections`

Returns summaries for the organization implied by **`X-Organization-Id`**. UIs often group rows by **status** (`active`, `paused`, `revoked`).

## Connection detail

`GET /v1/connections/{connectionId}`

Returns richer information including **granted scopes** and optional **settings** payload useful for support and auditing.

## Pause and resume

- **`POST /v1/connections/{connectionId}/pause`** — temporarily disables active use; implementation should treat paused connections as non-operational for new work.
- **`POST /v1/connections/{connectionId}/resume`** — restores an active state from paused.

**Roles:** `owner` and `admin` only (see [Permissions matrix](../reference/permissions-matrix.md)).

## Revoke

`POST /v1/connections/{connectionId}/revoke`

Marks the connection **revoked**. This is the strongest “turn off access” lever; restoring usually requires a new installation flow rather than resume.

## Trigger sync (optional integration hook)

`POST /v1/connections/{connectionId}/sync`

Creates a **sync job** record. Whether and how background workers process jobs depends on your deployment; the API models the **request** side for product consistency.

## Scope check

`POST /v1/scope-check`

Body identifies a **connection**, an **app id**, and a **scope** string. Response includes whether access is **granted** for that principal under current connection state.

Useful for **defense in depth**: even if your gateway trusts “there is a connection,” individual endpoints can re-verify a specific scope.

## Console parity

The web console includes connection list and detail routes that call the same API patterns: tabs by status, detail view with actions (revoke, pause, resume, sync) subject to the user’s role.

See [Connections in the console](../console/connections.md).

## Related topics

- [Concepts](concepts.md)
- [Installation requests and approval](installation-and-approval.md)
