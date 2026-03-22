# Changesets

Use [Changesets](https://github.com/changesets/changesets) to version and publish **`@falcon-framework/sdk`** to npm.

1. After a meaningful change, run `bun run changeset` and choose the SDK package.
2. Commit the generated file under `.changeset/`.
3. Merge to `main`. The release workflow opens or updates a **Version packages** PR.
4. Merge that PR to publish (requires `NPM_TOKEN` in repository secrets).

## Preview builds (not Changesets)

Pull-request preview publishes are handled separately by the [Preview SDK workflow](../.github/workflows/preview-sdk.yml). They **do not** use `changeset publish` or require a changeset file on the branch. They exist so every push to an in-repo PR can publish a prerelease for testing; normal semver releases and changelogs still go through the steps above.
