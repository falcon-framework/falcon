import { useMemo } from "react";

import { createFalconConnectClient } from "@falcon-framework/sdk/connect";
import { env } from "@falcon-framework/env/web";

import { useActiveOrg } from "@/providers/active-org";

import { useHydrated } from "./use-hydrated";

/** Connect API client only after hydration + org list + active org — reduces intermittent 401s. */
export function useConnectClient() {
  const { activeOrg, isLoading } = useActiveOrg();
  const hydrated = useHydrated();

  return useMemo(
    () =>
      hydrated && !isLoading && activeOrg?.id
        ? createFalconConnectClient({
            baseUrl: env.VITE_CONNECT_URL,
            organizationId: activeOrg.id,
          })
        : null,
    [hydrated, isLoading, activeOrg?.id],
  );
}
