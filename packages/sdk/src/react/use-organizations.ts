import { useMemo } from "react";
import type { FalconAuthClient } from "../core/client";
import { normalizeOrgListRow, type FalconOrgListItem } from "./org-normalize";
import { useFalconAuthContext } from "./provider";

export interface UseOrganizationsResult {
  organizations: FalconOrgListItem[];
  isPending: boolean;
  error: unknown;
  refetch: (() => Promise<void>) | undefined;
  client: FalconAuthClient;
  create: FalconAuthClient["organization"]["create"];
  setActive: FalconAuthClient["organization"]["setActive"];
}

/**
 * Lists the signed-in user's organizations and exposes Better Auth organization actions.
 *
 * Use this under {@link FalconAuthProvider} alone when you need **`create`** / **`setActive`** without
 * {@link ActiveOrganizationProvider} (which adds **`localStorage`**-backed active org selection — see {@link useActiveOrganization}).
 */
export function useOrganizations(): UseOrganizationsResult {
  const { client } = useFalconAuthContext();
  const { data: orgsData, isPending, error, refetch } = client.useListOrganizations();

  const organizations = useMemo(() => {
    const raw = orgsData ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const out: FalconOrgListItem[] = [];
    for (const row of list) {
      const item = normalizeOrgListRow(row);
      if (item) out.push(item);
    }
    return out;
  }, [orgsData]);

  return useMemo(
    () => ({
      organizations,
      isPending,
      error,
      refetch,
      create: client.organization.create.bind(client.organization),
      setActive: client.organization.setActive.bind(client.organization),
      client,
    }),
    [organizations, isPending, error, refetch, client],
  );
}
