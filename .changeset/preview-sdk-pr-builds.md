---
"@falcon-framework/sdk": patch
---

Publish prerelease builds of `@falcon-framework/sdk` from every push to a **non-draft** pull request targeting `main` (same-repo branches only). Packages are published to npm and GitHub Packages with prerelease versions (`x.y.z-beta.<shortSha>.<runAttempt>`). On npm, use the `@beta` dist-tag for the latest preview, or `pr-<number>` to follow a specific PR. See the root **README** (SDK publishing → Preview builds) for full details.
