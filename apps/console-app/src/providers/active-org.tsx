import type { ReactNode } from "react";
import type { FalconAuthClient } from "@falcon-framework/sdk";
import {
  ActiveOrganizationProvider,
  useActiveOrganization as useActiveOrg,
} from "@falcon-framework/sdk/react";

import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "falcon:activeOrgId";

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  return (
    <ActiveOrganizationProvider client={authClient as FalconAuthClient} storageKey={STORAGE_KEY}>
      {children}
    </ActiveOrganizationProvider>
  );
}

export { useActiveOrg };
