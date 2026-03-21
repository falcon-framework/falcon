# Organizations in the console

Organizations are the **tenant boundary** for Falcon Connect and the **membership** model for collaboration in the console.

## Creating an organization

Users open the **create organization** flow, provide a **name**, and usually a **slug** (URL-friendly identifier). On success, Better Auth returns the new organization id.

The console then **sets the active organization** so subsequent Connect API calls include the correct **`X-Organization-Id`**.

## Switching organizations

Users with multiple memberships can **switch** the active organization (org switcher in the shell). Switching updates:

- Which **connections** and **installation requests** load from Connect.
- Which **role** applies for permission checks (roles are per membership).

## Roles at a glance

| Role | Typical use |
| ---- | ----------- |
| **owner** | Full control; can approve installations; manage connections. |
| **admin** | Same as owner for Connect permission checks in the stock matrix. |
| **member** | May create installation requests; cannot approve or revoke connections. |

Exact strings must match what Better Auth stores and what Connect checks. See [Permissions matrix](../reference/permissions-matrix.md).

## Why orgs matter for Connect

Without an active org (or with zero memberships), the console cannot meaningfully call **`/v1/*`** routes: Connect refuses ambiguous organization context.

Demo applications mirror this by redirecting users to **org creation** when they have no orgs.

## Related topics

- [Falcon Auth organizations](../falcon-auth/organizations.md)
- [Calling the Connect API](../falcon-connect/authentication.md)
