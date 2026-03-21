# Organizations (Better Auth plugin)

Falcon’s console and demos use Better Auth’s **organization** plugin. Organizations give you:

- **Tenant-style grouping** for users (membership with a **role**).
- An **active organization** selection in the client, used when calling APIs that require **`X-Organization-Id`** (Falcon Connect).

## Roles

Membership rows carry a **role** string (for example `owner`, `admin`, `member`). Falcon Connect uses this role to decide whether a principal may **create installation requests**, **approve** them, **revoke** or **pause** connections, and run **scope checks**. See [Permissions matrix](../reference/permissions-matrix.md).

## Creating an organization

In the console (or any client using the same auth server), users with access to the organization APIs can **create** an organization with a name and slug. After creation, the client typically **sets the active organization** so subsequent operations are scoped correctly.

Demo applications often **force** users through an **org creation** route when they have zero memberships, because Connect calls without a known organization are ambiguous.

## Organizations vs Connect `organizationId`

Connect stores **`organization_id`** on installation requests and connections. That value must match the **Better Auth organization id** your client sends as **`X-Organization-Id`** so the Connect service can load the caller’s membership and enforce permissions.

## Multi-org users

Users may belong to multiple organizations. The **active org** in the UI (console or your app) determines which Connect data they see and which org id is sent on API requests. Switching org in the console switches this context.

## Related topics

- [Organizations in the console](../console/organizations.md)
- [Falcon Connect concepts](../falcon-connect/concepts.md)
- [Calling the Connect API](../falcon-connect/authentication.md)
