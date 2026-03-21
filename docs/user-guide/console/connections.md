# Connections in the console

When the console is configured with a **Connect service** base URL, authenticated users can inspect **Falcon Connect** data for their **active organization**.

## Connection list

The list view groups connections by **status**:

- **Active** — operational integrations.
- **Paused** — temporarily disabled.
- **Revoked** — terminated; should not be used for new operations.

Each row identifies participating **Connect apps** by name (resolved from the app directory) and shows metadata such as creation time.

## Connection detail

Opening a connection shows:

- **Status** and scope summary.
- **Actions** the user is allowed to perform (subject to role), such as **pause**, **resume**, **revoke**, or **request sync**—matching the API described in [Managing connections](../falcon-connect/managing-connections.md).

## Permissions

Console buttons call the same Connect endpoints your apps use. If the user’s role is insufficient (for example **member** trying to revoke), the API returns **403** and the UI surfaces an error.

## Relationship to installation requests

Some product flows create **installation requests** outside the console (from a source app). The console is still a valid place to **monitor** resulting connections once approved.

For the cross-app browser handoff pattern, see [Installation requests and approval](../falcon-connect/installation-and-approval.md).

## Related topics

- [Falcon Connect overview](../falcon-connect/README.md)
- [Account and connected apps](account-and-apps.md)
