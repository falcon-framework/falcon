import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { authClient } from "@/lib/auth-client";

const STORAGE_KEY = "falcon:activeOrgId";

type OrgItem = NonNullable<ReturnType<typeof authClient.useListOrganizations>["data"]>[number];

type ActiveOrgCtx = {
  activeOrg: OrgItem | null;
  orgs: OrgItem[];
  isLoading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
};

const ActiveOrgContext = createContext<ActiveOrgCtx>({
  activeOrg: null,
  orgs: [],
  isLoading: true,
  switchOrg: async () => {},
});

export function ActiveOrgProvider({ children }: { children: React.ReactNode }) {
  const { data: orgsData, isPending } = authClient.useListOrganizations();
  const orgs = useMemo(() => orgsData ?? [], [orgsData]);

  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Track whether we've done the initial auto-select to avoid loops
  const didInit = useRef(false);

  useEffect(() => {
    if (isPending || !orgs.length || didInit.current) return;
    didInit.current = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    const validStored = stored && orgs.find((o) => o.id === stored) ? stored : null;
    const targetId = validStored ?? orgs[0]!.id;

    setActiveOrgId(targetId);
    localStorage.setItem(STORAGE_KEY, targetId);
    // Fire-and-forget — keeps BA's internal session in sync
    authClient.organization.setActive({ organizationId: targetId }).catch(() => {});
  }, [isPending, orgs]);

  const switchOrg = useCallback(async (orgId: string) => {
    setActiveOrgId(orgId);
    localStorage.setItem(STORAGE_KEY, orgId);
    await authClient.organization.setActive({ organizationId: orgId });
  }, []);

  const activeOrg = useMemo(
    () => orgs.find((o) => o.id === activeOrgId) ?? null,
    [orgs, activeOrgId],
  );

  const value = useMemo(
    () => ({ activeOrg, orgs, isLoading: isPending, switchOrg }),
    [activeOrg, orgs, isPending, switchOrg],
  );

  return <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>;
}

export function useActiveOrg() {
  return useContext(ActiveOrgContext);
}
