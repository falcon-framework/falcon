# Installation requests and approval

This page describes the **end-to-end collaboration pattern** Falcon Connect supports: one application (the **source**) asks to connect to another (**target**), and an authorized user on the target side **approves** the request, resulting in a **connection**.

## Preconditions

1. **Identity**: the user is signed in with Falcon Auth (session cookie or JWT when calling APIs).
2. **Organization**: the user is a **member** of an organization, and clients send its id as **`X-Organization-Id`**.
3. **Catalog**: both apps exist as **`falcon_app`** rows, and the target exposes **capabilities** the source may request.
4. **Roles**:
   - **Creating** a request: `owner`, `admin`, or `member`.
   - **Approving** a request: `owner` or `admin` only.

See [Permissions matrix](../reference/permissions-matrix.md).

## API steps (logical)

### 1. Discover capabilities (optional but typical)

`GET /v1/apps/{targetAppId}/capabilities`

Returns which **scope_key** values exist for the target. A source app UI often uses this to populate checkboxes or to default “request all read scopes.”

### 2. Create installation request

`POST /v1/installation-requests`

Body includes **`sourceAppId`**, **`targetAppId`**, **`requestedScopes`**, and optional **`settingsDraft`**.

The service rejects duplicates if a pending request or non-revoked connection already exists for the same org and app pair (conflict semantics).

### 3. Approve

`POST /v1/installation-requests/{requestId}/approve`

Only a principal with approve rights can succeed. Success creates a **connection** and records granted scopes.

## Browser handoff pattern (demos)

Real products often **redirect the user’s browser** from the source app to the target app so the approver is in the right UX context (and may need to sign in or create an org on the target side).

A typical pattern:

1. Source app calls **`POST /v1/installation-requests`** via XHR/fetch with credentials.
2. Source app navigates to a **target URL** with query parameters such as **`requestId`** and a **`returnUrl`** back to the source.
3. Target app loads pending requests (or the specific id), shows details, and offers **Approve**.
4. On approve, target app calls **`POST /v1/installation-requests/{id}/approve`**, then sets **`window.location`** to **`returnUrl`**.

**Security product note:** `returnUrl` should be **validated** so you only redirect to origins you trust (demos compare origins to a configured peer origin).

## Same user, same org across apps

For the simplest SSO story, the **same Falcon user** should complete both sides, and the **organization id** used in **`X-Organization-Id`** should be the **same Better Auth organization** on both apps. Otherwise the installation request row may not appear where the approver expects, or approval may fail permission checks.

## After approval

- The **source** can list **connections** (`GET /v1/connections`) and show the new link.
- Either side (subject to role) may **pause**, **resume**, or **revoke** via connection endpoints. See [Managing connections](managing-connections.md).

## Related topics

- [Concepts](concepts.md)
- [Calling the Connect API](authentication.md)
- [Connections in the console](../console/connections.md)
