# Changesets

Use [Changesets](https://github.com/changesets/changesets) to version and publish **`@falcon-framework/sdk`** to npm.

1. After a meaningful change, run `bun run changeset` and choose the SDK package.
2. Commit the generated file under `.changeset/`.
3. Merge to `main`. The release workflow opens or updates a **Version packages** PR.
4. Merge that PR to publish (requires `NPM_TOKEN` in repository secrets).
