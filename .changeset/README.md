# Changesets

Use [Changesets](https://github.com/changesets/changesets) to version and publish **`@falcon-framework/sdk`** to npm.

1. After a meaningful change, run `bun run changeset` and choose the SDK package.
2. Commit the generated file under `.changeset/`.
3. Merge to `main`. The release workflow opens or updates a **Version packages** PR.
4. Merge that PR to publish (requires `NPM_TOKEN` in repository secrets).

## Prerelease branch `release/beta`

To publish **`x.y.z-beta.0`**, **`beta.1`**, … with Changesets (changelog + semver), use the long-lived branch **`release/beta`** (see the root **README**, SDK publishing → Prerelease branches).

1. On `release/beta`, run **`bunx changeset pre enter beta`** once and commit **`.changeset/pre.json`** so prerelease mode is active.
2. Add changeset files for SDK changes, push to `release/beta`. The [SDK release (beta) workflow](../.github/workflows/sdk-release-beta.yml) runs `changeset version`, publishes, and commits the version bump back to the branch.

This is separate from **`main`**: merge or cherry-pick work into `release/beta` when you want beta releases.

## Branch `dev` (alpha; not Changesets)

Pushes to **`dev`** publish snapshot-style **`x.y.z-alpha.<sha>`** builds via [SDK dev (alpha)](../.github/workflows/sdk-dev-alpha.yml). No changeset files are required on that branch.
