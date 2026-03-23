# @falcon-framework/sdk

## 0.7.0

### Minor Changes

- [#18](https://github.com/falcon-framework/falcon/pull/18) [`6611720`](https://github.com/falcon-framework/falcon/commit/66117203cbb4139df1c4a842330af43eea2b6eb9) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add server-side Falcon Connect token exchange helpers and document the non-cookie backend auth flow for Connect.

## 0.6.1

### Patch Changes

- [#16](https://github.com/falcon-framework/falcon/pull/16) [`c117c21`](https://github.com/falcon-framework/falcon/commit/c117c2184c9efda782e16e3685da79581284ed4a) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Declare **zod** as an **optional peer dependency** (`^4.1.0`) instead of a `catalog:` runtime dependency, so the published `package.json` uses explicit semver ranges suitable for npm consumers.

  **Migration:** when using `@falcon-framework/sdk/connect`, install **zod** in your application (for example `bun add zod`). The Connect entry imports Zod at runtime for validation.

## 0.6.0

### Minor Changes

- [#14](https://github.com/falcon-framework/falcon/pull/14) [`557ad38`](https://github.com/falcon-framework/falcon/commit/557ad380894b6b0b5ba53161c7e9d8c2f68bbef0) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add a **Falcon Connect HTTP client** on `@falcon-framework/sdk/connect`: **`createFalconConnectClient`** wraps all Connect API v1 endpoints with **fetch**, optional **`X-Falcon-App-Id`** / **`X-Organization-Id`** (via existing `buildFalconConnectHeaders`), optional **Bearer** tokens, and **Zod** validation of every success response and mutation body.

  **New runtime dependency:** `zod` (declared on the SDK package).

  **Errors:** `FalconConnectHttpError`, `FalconConnectValidationError`, `FalconConnectParseError`, and `FalconConnectNetworkError` for structured handling.

  **Behavior change:** successful HTTP responses are now **parsed with Zod**. Previously, apps using ad-hoc clients relied on unchecked `as` casts; if the server returned an unexpected shape, you now get `FalconConnectValidationError` instead of silent type lies.

  **Docs:** user-guide page `docs/user-guide/sdk/falcon-connect-client.md` (recipes for source, target, and management flows).

  Display helpers (`resolveFalconConnectionsDisplay`, etc.) are unchanged and compose with the new client.

## 0.5.0

### Minor Changes

- [#12](https://github.com/falcon-framework/falcon/pull/12) [`40beef8`](https://github.com/falcon-framework/falcon/commit/40beef86a58f58e5fac0b747166303ecbe271d03) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add **`useOrganizations`** React hook: lists the signed-in user’s organizations (normalized `id` / `name` / `slug`), exposes Better Auth **`create`** and **`setActive`**, and passes through **`refetch`** / **`error`** from **`useListOrganizations`**. Document creating organizations via **`client.organization.create`** in the package README and SDK user guides (`organizations.md`, `react-integration.md`).

## 0.4.0

### Minor Changes

- [#9](https://github.com/falcon-framework/falcon/pull/9) [`4f612ac`](https://github.com/falcon-framework/falcon/commit/4f612ac35240f1ab79ba56d422f6b28e82e9ff47) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add first-class organization support: optional organization fields on session types, `buildFalconConnectHeaders` for Connect, `ActiveOrganizationProvider` / `useActiveOrganization`, Tailwind `OrganizationSwitcher`, re-export of `organizationClient`, and expanded `verifySession` typing. Documentation updates cover SDK user-guide organizations and related topics.

## 0.3.0

### Minor Changes

- [#6](https://github.com/falcon-framework/falcon/pull/6) [`534dbcf`](https://github.com/falcon-framework/falcon/commit/534dbcf6be91378383f08cb41bbf87857dfeb028) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add `completeAuthCallback` to the main SDK entry. It validates the OAuth `code` and optional `state`, runs the code exchange (typically `exchangeCodeForSession`), and polls until the session is visible to the app or retries are exhausted—matching the flow used by the demo apps.

  Refresh the package README: peer dependencies, entry points, browser auth (redirects, callback, session), and development commands are documented accurately.

### Patch Changes

- [#8](https://github.com/falcon-framework/falcon/pull/8) [`e7e32bb`](https://github.com/falcon-framework/falcon/commit/e7e32bb2e1558984c9de7b0dbf646e25eec6bfe4) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Support **comma-separated** `CORS_ORIGIN` values when running Falcon Auth: the auth server’s CORS allow-list and Better Auth **trusted origins** (in `@falcon-framework/auth`) now parse `CORS_ORIGIN` as a list (split on commas, trimmed). You can list several first-party origins in one variable—for example the console and multiple local demo apps on different ports—without relying on a single origin string.

  **Migration:** If you already use a single origin, behavior is unchanged. To allow multiple origins, set `CORS_ORIGIN` to a comma-separated list (no spaces required, but surrounding spaces around each entry are trimmed).

## 0.2.3

### Patch Changes

- [`fc4bab6`](https://github.com/falcon-framework/falcon/commit/fc4bab6eb60e061bd3dd6c46e98d11979b1240d1) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Set **`prepublishOnly`** to `npm run build` so `tsdown` resolves from `node_modules/.bin` during `changeset publish` and CI (fixes `tsdown: command not found`).

## 0.2.2

### Patch Changes

- [#3](https://github.com/falcon-framework/falcon/pull/3) [`a4c1775`](https://github.com/falcon-framework/falcon/commit/a4c1775881a12e9c2f29b131ac4165068370ef2a) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Move `better-auth` to a **peer dependency** (with version range `^1.5.0`) so consumers control the installed version and avoid duplicate installs. Pin SDK dev tooling (`typescript`, `@types/react`, `@types/react-dom`), add `engines.node` (`>=22`), and document peer requirements in the README. Demos declare `better-auth` explicitly.

## 0.2.1

### Patch Changes

- [`859bfa6`](https://github.com/falcon-framework/falcon/commit/859bfa6eda6d26ad59b1a853ccb8d11cbdc15860) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Harden the release pipeline: skip GitHub Packages publish when that version already exists (avoids 409 on retries), and pin `publishConfig.registry` to the public npm registry so `changeset publish` targets npm after GitHub.

## 0.2.0

### Minor Changes

- [`fcaada1`](https://github.com/falcon-framework/falcon/commit/fcaada14f48754d3fa28796a4a1fac52d0dd83a7) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add hosted-auth redirect helpers, session and cookie utilities (`sessionCookieName`), Connect client and display helpers, React provider/hooks and sign-in, sign-up, and user-button components, and server middleware for Falcon apps. Expand package metadata, README, and tests.

- [`f4c868a`](https://github.com/falcon-framework/falcon/commit/f4c868a7ee0eddb46a9a2918f55d9dd2e15b7048) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Make the SDK production-ready and set up CI/CD tooling
