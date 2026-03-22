import type { FalconOrganizationSummary } from "../core/types";

/** Minimal org fields used by list UIs and {@link useActiveOrganization}. */
export type FalconOrgListItem = Pick<FalconOrganizationSummary, "id" | "name" | "slug">;

export function normalizeOrgListRow(row: unknown): FalconOrgListItem | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const name = typeof o.name === "string" ? o.name : null;
  const slug = typeof o.slug === "string" ? o.slug : null;
  if (!id || !name || !slug) return null;
  return { id, name, slug };
}
