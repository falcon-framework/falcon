import { useMemo } from "react";

import { makeConnectClient } from "@/lib/connect-client";
import { useActiveOrg } from "@/providers/active-org";

import { useHydrated } from "./use-hydrated";

/** Connect API client only after hydration + org list + active org — reduces intermittent 401s. */
export function useConnectClient() {
  const { activeOrg, isLoading } = useActiveOrg();
  const hydrated = useHydrated();

  return useMemo(
    () => (hydrated && !isLoading && activeOrg?.id ? makeConnectClient(activeOrg.id) : null),
    [hydrated, isLoading, activeOrg?.id],
  );
}
