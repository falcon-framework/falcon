# Falcon Connect

Falcon Connect manages **relationships between registered applications** within an **organization**: which app may integrate with which, under which **scopes**, and whether access is **pending**, **active**, **paused**, or **revoked**.

## Topics

| Document                                                           | Description                              |
| ------------------------------------------------------------------ | ---------------------------------------- |
| [Concepts](concepts.md)                                            | Apps, capabilities, scopes, org scope    |
| [Installation requests and approval](installation-and-approval.md) | Source/target flow and browser handoff   |
| [Managing connections](managing-connections.md)                    | Pause, resume, revoke, sync, scope check |
| [Calling the Connect API](authentication.md)                       | `X-Organization-Id`, cookies, JWT        |

## Who should read this

- **Product engineers** designing cross-app integrations.
- **Frontend developers** driving installation UIs.
- **Backend operators** securing Connect behind the same identity stack as Falcon Auth.

## SDK

- **HTTP client** — [`createFalconConnectClient`](../sdk/falcon-connect-client.md) (Zod-validated fetch wrapper for all v1 endpoints).
- **Display helpers** — [Connect display helpers](../sdk/connect-helpers.md) (pure label / line builders).
