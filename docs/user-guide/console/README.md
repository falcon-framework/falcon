# Falcon console

The **console** is the first-party web application for end users and admins who use Falcon day to day. It uses the **same Falcon Auth server** as your integrated products (default setup).

## Topics

| Document                                                    | Description                                |
| ----------------------------------------------------------- | ------------------------------------------ |
| [Account, profile, and connected apps](account-and-apps.md) | User profile and Auth app directory        |
| [Organizations](organizations.md)                           | Creating orgs and switching context        |
| [Connections](connections.md)                               | Viewing and managing Connect relationships |

## What the console is not

- It is **not** a full “Falcon Auth admin” or “Connect catalog CMS” for every database table. Registering new **`falcon_auth_app`** or **`falcon_app`** rows is typically an **operator** task (SQL, migrations, internal tooling).
- In-product **SDK documentation** may appear inside the console for developers; see [SDK docs surface](account-and-apps.md#sdk-documentation-surface).

## Related reading

- [Architecture](../getting-started/architecture.md)
- [Falcon Auth organizations](../falcon-auth/organizations.md)
