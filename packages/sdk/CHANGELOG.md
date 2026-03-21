# @falcon-framework/sdk

## 0.2.1

### Patch Changes

- [`859bfa6`](https://github.com/falcon-framework/falcon/commit/859bfa6eda6d26ad59b1a853ccb8d11cbdc15860) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Harden the release pipeline: skip GitHub Packages publish when that version already exists (avoids 409 on retries), and pin `publishConfig.registry` to the public npm registry so `changeset publish` targets npm after GitHub.

## 0.2.0

### Minor Changes

- [`fcaada1`](https://github.com/falcon-framework/falcon/commit/fcaada14f48754d3fa28796a4a1fac52d0dd83a7) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Add hosted-auth redirect helpers, session and cookie utilities (`sessionCookieName`), Connect client and display helpers, React provider/hooks and sign-in, sign-up, and user-button components, and server middleware for Falcon apps. Expand package metadata, README, and tests.

- [`f4c868a`](https://github.com/falcon-framework/falcon/commit/f4c868a7ee0eddb46a9a2918f55d9dd2e15b7048) Thanks [@benjamin-kraatz](https://github.com/benjamin-kraatz)! - Make the SDK production-ready and set up CI/CD tooling
