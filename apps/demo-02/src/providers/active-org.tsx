import type { ReactNode } from "react";
import {
  ActiveOrganizationProvider,
  useActiveOrganization as useActiveOrg,
} from "@falcon-framework/sdk/react";

const STORAGE_KEY = "falcon-demo02:activeOrgId";

export function ActiveOrgProvider({ children }: { children: ReactNode }) {
  return (
    <ActiveOrganizationProvider storageKey={STORAGE_KEY}>{children}</ActiveOrganizationProvider>
  );
}

export { useActiveOrg };
