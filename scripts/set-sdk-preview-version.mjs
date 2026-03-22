#!/usr/bin/env node
/**
 * CI helper: writes a prerelease version to packages/sdk/package.json before `npm publish`.
 * Invoked by `.github/workflows/preview-sdk.yml` only; not used for Changesets releases.
 *
 * Version shape: `{base}-beta.{shortSha}.{runAttempt}`
 * - `base` — major.minor.patch parsed from the existing `version` field (strips any prerelease suffix).
 * - `shortSha` — first 7 hex chars of `PR_HEAD_SHA` or `GITHUB_SHA`.
 * - `runAttempt` — `GITHUB_RUN_ATTEMPT` (default `1`) so a retried workflow run can publish a new version
 *   without a new commit.
 *
 * Environment:
 * - `PR_HEAD_SHA` — preferred in PR workflows (the PR head commit).
 * - `GITHUB_SHA` — fallback when `PR_HEAD_SHA` is unset.
 * - `GITHUB_RUN_ATTEMPT` — optional; forwarded from Actions.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const pkgPath = path.join(root, "packages/sdk/package.json")

const headSha = process.env.PR_HEAD_SHA || process.env.GITHUB_SHA || ""
const shortSha = headSha.slice(0, 7) || "unknown"
const runAttempt = process.env.GITHUB_RUN_ATTEMPT || "1"

const raw = fs.readFileSync(pkgPath, "utf8")
const pkg = JSON.parse(raw)
const baseMatch = pkg.version.match(/^\d+\.\d+\.\d+/)
const base = baseMatch ? baseMatch[0] : pkg.version
const version = `${base}-beta.${shortSha}.${runAttempt}`

pkg.version = version
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

process.stdout.write(version)
