---
"@falcon-framework/sdk": patch
---

Move `better-auth` to a **peer dependency** (with version range `^1.5.0`) so consumers control the installed version and avoid duplicate installs. Pin SDK dev tooling (`typescript`, `@types/react`, `@types/react-dom`), add `engines.node` (`>=22`), and document peer requirements in the README. Demos declare `better-auth` explicitly.
