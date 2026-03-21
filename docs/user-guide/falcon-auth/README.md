# Falcon Auth

Falcon Auth is your deployment’s **identity provider**: users authenticate against the auth server, and integrated applications use the SDK (or raw HTTP) to obtain session state and optional organization context.

## Topics

| Document                                        | Description                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| [Centralized sign-in](centralized-sign-in.md)   | Hosted pages, `client_id`, `redirect_uri`, and return to your app |
| [Registering client apps](app-registration.md)  | `falcon_auth_app`, origins, redirect URLs, publishable keys       |
| [Sessions and cookies](sessions-and-cookies.md) | Cross-origin session behavior and `get-session`                   |
| [Organizations](organizations.md)               | Better Auth organization plugin and membership                    |

## Relationship to Falcon Connect

Connect uses the same user identities. It validates the caller by session cookie or JWT, then checks **organization membership** for `X-Organization-Id`. See [Calling the Connect API](../falcon-connect/authentication.md).

## SDK entry points

- React: [React integration](../sdk/react-integration.md)
- Hosted URL builders: [Hosted sign-in URLs](../sdk/hosted-sign-in-urls.md)
- Backend: [Server session verification](../sdk/server-verification.md)
