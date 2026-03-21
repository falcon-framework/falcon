# Falcon JavaScript SDK

The package **`@falcon-framework/sdk`** helps React and Node (or compatible) runtimes integrate Falcon Auth and optional Connect UI helpers.

## Topics

| Document                                              | Description                                                 |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| [React integration](react-integration.md)             | Provider, hooks, optional components                        |
| [Hosted sign-in URLs](hosted-sign-in-urls.md)         | `buildFalconHostedSignInUrl` / `buildFalconHostedSignUpUrl` |
| [Server session verification](server-verification.md) | `verifySession`                                             |
| [Connect display helpers](connect-helpers.md)         | `@falcon-framework/sdk/connect`                             |

## Package entry points

| Import path                     | Purpose                                    |
| ------------------------------- | ------------------------------------------ |
| `@falcon-framework/sdk`         | Core client factory and hosted URL helpers |
| `@falcon-framework/sdk/react`   | React provider, hooks, UI primitives       |
| `@falcon-framework/sdk/server`  | Session verification for backends          |
| `@falcon-framework/sdk/connect` | Optional connection list display utilities |

## Requirements (React UI)

Pre-built components expect **React 18+** and **Tailwind CSS** with shadcn-style CSS variables, matching the Falcon design tokens used in demos.

## Related reading

- [Falcon Auth overview](../falcon-auth/README.md)
- [Falcon Connect overview](../falcon-connect/README.md)
