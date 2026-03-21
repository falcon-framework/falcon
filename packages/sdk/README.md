# FALCON SDK

This package contains the FALCON SDK to let third-party apps integrate with the FALCON platform. It provides all primitives to implement FALCON Connect ("install apps") and FALCON Auth, the unified authentication system for having a single sign-on experience across all apps.

## Installation

```sh
npm install @falcon-framework/sdk
# or
bun add @falcon-framework/sdk
# or
pnpm add @falcon-framework/sdk
```

### Peer dependencies

For React helpers and UI (`@falcon-framework/sdk/react`), install compatible versions of:

- `react` (>= 18)
- `react-dom` (>= 18)

The core client and server helpers do not require React at runtime.

### Entry points

| Import path                    | Use case                                            |
| ------------------------------ | --------------------------------------------------- |
| `@falcon-framework/sdk`        | `createFalconAuth` client                           |
| `@falcon-framework/sdk/react`  | Provider, hooks, `SignIn` / `SignUp` / `UserButton` |
| `@falcon-framework/sdk/server` | `verifySession` for backend route protection        |

## Development (in this monorepo)

From the repository root:

```sh
bun install
bun run sdk:build
bun run sdk:check-types
```

Or from `packages/sdk`:

```sh
bun run build
bun run check-types
```

The published package is built with [tsdown](https://tsdown.dev/) into `dist/`.

## When to use the SDK

If one of the following is true, you should use the FALCON SDK:

- You want to integrate your apps into each other ("install apps" feature)
- You want to use a unified authentication system for your apps

Then, you should use the FALCON SDK.

> [!WARNING]
> The FALCON SDK is not yet fully available, nor does FALCON provide any documentation, access, support, or any other resources. This is a work in progress.
