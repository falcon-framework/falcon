# @falcon-framework/sdk

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
