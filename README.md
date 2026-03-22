# FALCON

**FALCON** is a self-hosted identity and app-connectivity platform: **Falcon Auth** (unified sign-in and sessions across your apps), **FALCON Connect** (“install” and link apps to each other), and a published **[`@falcon-framework/sdk`](https://www.npmjs.com/package/@falcon-framework/sdk)** so third-party apps can integrate with the same APIs and React building blocks—similar in spirit to hosted identity products, but you run the stack.

This repository is a **Bun + Nx** monorepo: Cloudflare Workers services, a TanStack Start console, demo apps, shared packages, and Alchemy-based local development and deployment.

## What lives here

| Area            | Role                                                                       |
| --------------- | -------------------------------------------------------------------------- |
| **Falcon Auth** | Better Auth–backed auth API and HTML flows (`apps/auth-server`).           |
| **Connect**     | Connection / “install apps” API (`apps/connect-service`).                  |
| **Console**     | Org and settings UI for operators (`apps/console-app`).                    |
| **Demos**       | Sample Vite apps wired to Auth + Connect (`apps/demo-01`, `apps/demo-02`). |
| **SDK**         | Publishable client, React UI, and server helpers (`packages/sdk`).         |

Details for consumers of the npm package are in [`packages/sdk/README.md`](packages/sdk/README.md).

## Stack (high level)

- **TypeScript** throughout
- **Hono** + **oRPC** on Workers for APIs
- **Better Auth** for authentication
- **Drizzle ORM** + **PostgreSQL** for persistence
- **TanStack Start** + **Vite** for the console (and demos)
- **Tailwind CSS** and shared **shadcn/ui** primitives in `packages/ui`
- **Alchemy** for Cloudflare dev/deploy orchestration (`packages/infra`)
- **Nx** for task graph and caching; **Oxlint** / **Oxfmt** for lint and format

The repo was originally scaffolded from [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack); layout and app names have evolved with FALCON.

## Getting started

Install dependencies:

```bash
bun install
```

### Database

1. Run **PostgreSQL** locally or point at a hosted instance.
2. Create `apps/auth-server/.env` and set at least:

   ```bash
   DATABASE_URL=postgresql://...
   ```

   (Drizzle CLI reads this path; see `packages/db/drizzle.config.ts`.)

3. Apply the schema:

   ```bash
   bun run db:push
   ```

4. For the Connect demos, seed fixture rows (expects `DATABASE_URL` as above):

   ```bash
   bun run e2e:seed
   ```

### Local development

**Full stack (recommended):** Auth, Connect, and the console are wired in Alchemy with dev ports **3000** (auth), **3001** (connect), and the console on **3002** (see `packages/infra/alchemy.run.ts`).

```bash
nx run @falcon-framework/infra:dev
```

Copy `apps/demo-01/.env.example` to `apps/demo-01/.env.local` (and the same for `demo-02` if you use it) so `VITE_*` URLs match those services.

**Demos only** (after Auth + Connect are up, or alongside them):

```bash
nx run demo-01:dev
nx run demo-02:dev
```

**Everything with a `dev` target** (infra + both demos):

```bash
bun run dev
```

### URLs (typical local setup)

| Service                   | URL                                            |
| ------------------------- | ---------------------------------------------- |
| Falcon Auth (auth-server) | [http://localhost:3000](http://localhost:3000) |
| Connect service           | [http://localhost:3001](http://localhost:3001) |
| Console                   | [http://localhost:3002](http://localhost:3002) |
| Demo 01                   | [http://localhost:3010](http://localhost:3010) |
| Demo 02                   | [http://localhost:3011](http://localhost:3011) |

## UI customization

Shared primitives live in `packages/ui`.

- Tokens and globals: `packages/ui/src/styles/globals.css`
- Components: `packages/ui/src/components/*`
- shadcn config: `packages/ui/components.json` and `apps/console-app/components.json`

Add more shared primitives from the repo root:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Example import:

```tsx
import { Button } from "@falcon-framework/ui/components/button";
```

App-specific blocks can be generated from `apps/console-app` instead of `packages/ui`.

## Deployment (Cloudflare via Alchemy)

- Deploy: `bun run deploy`
- Destroy: `bun run destroy`

See [Deploying to Cloudflare with Alchemy](https://www.better-t-stack.dev/docs/guides/cloudflare-alchemy) for platform-specific notes.

## Quality and tests

- Format and lint fix: `bun run check`
- Typecheck across projects: `bun run check-types`
- Unit tests: `bun run test`
- E2E (Playwright): `bun run test:e2e`

## SDK publishing

The public package is built from `packages/sdk`:

```bash
bun run sdk:build
bun run sdk:check-types
```

Releases use [Changesets](https://github.com/changesets/changesets) (`bun run changeset`, etc.). The [Release workflow](.github/workflows/release.yml) publishes **`@falcon-framework/sdk` to [GitHub Packages](https://github.com/orgs/falcon-framework/packages) first**, then to [npm](https://www.npmjs.com/package/@falcon-framework/sdk). The GitHub step uses `scripts/publish-sdk-github.sh` with an isolated `.npmrc` so the GitHub token does not override npm credentials; GitHub publish uses `--no-provenance` because npm provenance is tied to the npm registry.

### Prerelease branches (`release/beta` and `dev`)

Long-lived branches publish **`@falcon-framework/sdk`** to npm and GitHub Packages on **push** (no PR workflow). Stable releases from `main` still use Changesets and [`.github/workflows/release.yml`](.github/workflows/release.yml).

#### `release/beta` (Changesets prerelease)

The [SDK release (beta) workflow](.github/workflows/sdk-release-beta.yml) runs on every push to **`release/beta`**.

1. Contributors add **pending** `.changeset/*.md` files on `release/beta` (same `bun run changeset` flow as for `main`).
2. The branch must include **prerelease mode** for the `beta` tag: run `bunx changeset pre enter beta` once on `release/beta` and commit [`.changeset/pre.json`](.changeset/pre.json) (and any files Changesets creates). Without this, `changeset version` will not produce `x.y.z-beta.N` releases.
3. On push, CI runs `changeset version`, builds the SDK, publishes to GitHub Packages then npm via `bun run release-packages`, then **commits and pushes** the updated `packages/sdk` version, changelog, and consumed changesets back to `release/beta`.

If there are **no** pending changesets, the workflow exits without publishing (no infinite loop when the bot pushes after a release).

Install the latest beta line from npm:

```bash
npm install @falcon-framework/sdk@beta
```

**Setup:** create `release/beta` from `main`, enter prerelease mode as above, then push. **`NPM_TOKEN`** is required (same as release). If branch protection blocks direct pushes, allow **GitHub Actions** to push to `release/beta` or use a PAT. [`.changeset/config.json`](.changeset/config.json) `baseBranch` is `main`; changelog links on this branch may still reference `main` as the base (known limitation).

#### `dev` (alpha snapshots)

The [SDK dev (alpha) workflow](.github/workflows/sdk-dev-alpha.yml) runs on every push to **`dev`**. It does **not** use Changesets. CI sets a unique version `x.y.z-alpha.<shortSha>.<runAttempt>` (see [`scripts/set-sdk-dev-alpha-version.mjs`](scripts/set-sdk-dev-alpha-version.mjs)), then publishes to npm and GitHub Packages.

```bash
npm install @falcon-framework/sdk@alpha
```

Alpha publishes use `--no-provenance` on npm (same rationale as in the release pipeline’s GitHub Packages step).

**Repository setup**

- **`NPM_TOKEN`**: required for npm (same as release).
- **`GITHUB_TOKEN`**: provided by Actions; workflows use `packages: write` where needed for GitHub Packages.

### Installing from GitHub Packages

To consume the package from GitHub’s npm registry instead of (or in addition to) npmjs, add a project or user `.npmrc`:

```ini
@falcon-framework:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Use a token with at least `read:packages` (for private packages in the org) or a fine-grained token scoped to the repository. The scope **`@falcon-framework`** must match the GitHub organization that owns this repository (`falcon-framework`).

## Project structure

```
falcon/
├── apps/
│   ├── auth-server/      # Falcon Auth API (Hono, oRPC, Better Auth)
│   ├── connect-service/  # FALCON Connect API
│   ├── console-app/      # Operator console (TanStack Start + Vite; optional Tauri desktop scripts)
│   ├── demo-01/          # SDK + Connect demo (source app)
│   └── demo-02/          # SDK + Connect demo (peer app)
├── packages/
│   ├── api/              # oRPC routers and shared API code
│   ├── auth/             # Auth configuration and helpers
│   ├── connection/       # Connect domain logic
│   ├── db/               # Drizzle schema, migrations, seeds
│   ├── env/              # Typed environment variables
│   ├── infra/            # Alchemy entrypoint (local dev + deploy)
│   ├── sdk/              # @falcon-framework/sdk (published)
│   └── ui/               # Shared UI (shadcn/Tailwind)
└── e2e/                  # Playwright tests and DB seed script
```

## Useful scripts

| Script                                         | Purpose                                                 |
| ---------------------------------------------- | ------------------------------------------------------- |
| `bun run dev`                                  | Nx `dev` on all projects that define it (infra + demos) |
| `bun run build`                                | Build all projects                                      |
| `bun run check-types`                          | Typecheck across the workspace                          |
| `bun run db:push`                              | Push Drizzle schema to the database                     |
| `bun run db:generate`                          | Generate migrations                                     |
| `bun run db:migrate`                           | Run migrations                                          |
| `bun run db:studio`                            | Open Drizzle Studio                                     |
| `bun run check`                                | Oxlint + Oxfmt                                          |
| `cd apps/console-app && bun run desktop:dev`   | Tauri desktop shell for the console                     |
| `cd apps/console-app && bun run desktop:build` | Build Tauri desktop app                                 |

Desktop builds expect a static/export web build where applicable; align TanStack Start output with Tauri’s asset layout before shipping desktop artifacts.
