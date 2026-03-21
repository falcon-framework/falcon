# Connect permissions by organization role

Falcon Connect enforces **organization-scoped** permissions using the caller’s **membership role** (Better Auth organization plugin). The checks live in `@falcon-framework/auth` permission helpers used by Connect services.

## Matrix

| Action                       | `owner` | `admin` | `member` |
| ---------------------------- | ------- | ------- | -------- |
| Create installation request  | yes     | yes     | yes      |
| Approve installation request | yes     | yes     | no       |
| Revoke connection            | yes     | yes     | no       |
| Pause connection             | yes     | yes     | no       |
| Resume connection            | yes     | yes     | no       |
| Trigger sync                 | yes     | yes     | no       |
| Scope check                  | yes     | yes     | yes      |

## Notes

- **Approve** is the gate that turns a **pending installation request** into a **connection**. Product flows should route that action to trusted administrators on the **target** side (or your policy equivalent).
- **Member** can initiate integration work but cannot tear down or pause infrastructure-level links—reducing accidental outages.
- If you introduce custom roles, you must update **both** Better Auth membership data and the permission functions to stay coherent.

## Related topics

- [Concepts](../falcon-connect/concepts.md)
- [Organizations in the console](../console/organizations.md)
