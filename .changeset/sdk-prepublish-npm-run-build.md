---
"@falcon-framework/sdk": patch
---

Set **`prepublishOnly`** to `npm run build` so `tsdown` resolves from `node_modules/.bin` during `changeset publish` and CI (fixes `tsdown: command not found`).
