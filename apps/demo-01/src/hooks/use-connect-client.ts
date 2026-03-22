import { createFalconConnectClient } from "@falcon-framework/sdk/connect";
import { demoEnv } from "#/lib/demo-env";
import { useActiveOrg } from "#/providers/active-org";
import { useHydrated } from "#/hooks/use-hydrated";
import { useMemo } from "react";

export function useConnectClient() {
  const { activeOrg, isLoading } = useActiveOrg();
  const hydrated = useHydrated();

  return useMemo(
    () =>
      hydrated && !isLoading && activeOrg?.id
        ? createFalconConnectClient({
            baseUrl: demoEnv.VITE_CONNECT_URL,
            organizationId: activeOrg.id,
            publishableKey: demoEnv.VITE_FALCON_PUBLISHABLE_KEY,
          })
        : null,
    [hydrated, isLoading, activeOrg?.id],
  );
}
