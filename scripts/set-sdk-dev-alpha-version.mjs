#!/usr/bin/env node
/**
 * CI helper: writes a prerelease version to packages/sdk/package.json before `npm publish`.
 * Used by `.github/workflows/sdk-dev-alpha.yml` on pushes to the `dev` branch only.
 *
 * Version shape: `{base}-alpha.{shortSha}.{runAttempt}`
 * - `base` — major.minor.patch parsed from the existing `version` field.
 * - `shortSha` — first 7 hex chars of `GITHUB_SHA`.
 * - `runAttempt` — `GITHUB_RUN_ATTEMPT` (default `1`) so a retried run can publish again.
 *
 * Environment: `GITHUB_SHA`, `GITHUB_RUN_ATTEMPT` (optional).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const pkgPath = path.join(root, "packages/sdk/package.json")

const headSha = process.env.GITHUB_SHA || ""
const shortSha = headSha.slice(0, 7) || "unknown"
const runAttempt = process.env.GITHUB_RUN_ATTEMPT || "1"

const raw = fs.readFileSync(pkgPath, "utf8")
const pkg = JSON.parse(raw)
const baseMatch = pkg.version.match(/^\d+\.\d+\.\d+/)
const base = baseMatch ? baseMatch[0] : pkg.version
const version = `${base}-alpha.${shortSha}.${runAttempt}`

pkg.version = version
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

process.stdout.write(version)
