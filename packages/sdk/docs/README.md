# FALCON SDK Docs

This `docs/` directory is the package-local onboarding guide for **`@falcon-framework/sdk`**. It is written for package consumers first and complements the broader repository user guides.

## Start Here

- Read [Auth Getting Started](./auth-getting-started.md) if you need:
  - hosted sign-in and sign-up
  - browser session handling
  - React integration
  - organizations and active organization state
  - backend session verification
- Read [Connect Getting Started](./connect-getting-started.md) if you need:
  - Connect API clients
  - installation requests and approval flows
  - browser cookie-based Connect calls
  - backend / BFF Connect calls with short-lived access tokens
  - Connect display helpers

## Package Entry Points

| Import path | Purpose |
| --- | --- |
| `@falcon-framework/sdk` | Core Auth helpers, session helpers, redirect helpers, cookie helpers, org/client utilities |
| `@falcon-framework/sdk/react` | React provider, hooks, and prebuilt UI components |
| `@falcon-framework/sdk/server` | Session verification and backend Connect token exchange |
| `@falcon-framework/sdk/connect` | Connect HTTP client, schemas, errors, and display helpers |

## Which Guide to Read

- Browser app using hosted Auth only: start with [Auth Getting Started](./auth-getting-started.md#1-install-and-choose-entry-points)
- React app with user/account UI: start with [Auth Getting Started](./auth-getting-started.md#5-add-react-integration)
- Backend / API that needs Falcon identity: start with [Auth Getting Started](./auth-getting-started.md#8-add-server-side-session-verification)
- Browser app calling Connect directly: start with [Connect Getting Started](./connect-getting-started.md#3-create-a-browser-connect-client)
- Backend / BFF calling Connect: start with [Connect Getting Started](./connect-getting-started.md#4-create-a-backend-or-bff-connect-client)

## Secondary References

If you need more platform-level context, the repo user guides remain useful secondary references:

- [Repository SDK guide](../../../docs/user-guide/sdk/README.md)
- [Falcon Auth overview](../../../docs/user-guide/falcon-auth/README.md)
- [Falcon Connect overview](../../../docs/user-guide/falcon-connect/README.md)
