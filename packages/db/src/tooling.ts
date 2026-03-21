import { makeDb } from "./index.js";

/** Long-lived client for scripts, seeds, and local tooling only — never import in Workers. */
export const db = makeDb();
