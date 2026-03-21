---
"@falcon-framework/sdk": patch
---

Harden the release pipeline: skip GitHub Packages publish when that version already exists (avoids 409 on retries), and pin `publishConfig.registry` to the public npm registry so `changeset publish` targets npm after GitHub.
