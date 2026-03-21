import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FalconOrganizationSummary } from "../core/types";
import { useFalconAuthContext } from "./provider";

export type FalconActiveOrganizationItem = Pick<
  FalconOrganizationSummary,
  "id" | "name" | "slug"
>;

export interface ActiveOrganizationContextValue {
  activeOrg: FalconActiveOrganizationItem | null;
  orgs: FalconActiveOrganizationItem[];
  isLoading: boolean;
  switchOrg: (organizationId: string) => Promise<void>;
}

const ActiveOrganizationContext = createContext<ActiveOrganizationContextValue | null>(null);

export interface ActiveOrganizationProviderProps {
  children: ReactNode;
  /**
   * `localStorage` key for the selected organization id.
   * @default "falcon:activeOrgId"
   */
  storageKey?: string;
}

function toOrgItem(row: unknown): FalconActiveOrganizationItem | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const name = typeof o.name === "string" ? o.name : null;
  const slug = typeof o.slug === "string" ? o.slug : null;
  if (!id || !name || !slug) return null;
  return { id, name, slug };
}

/**
 * Keeps a **selected organization** in sync with Better Auth (`organization.setActive`) and `localStorage`.
 * Must be used inside {@link FalconAuthProvider}.
 */
export function ActiveOrganizationProvider({
  children,
  storageKey = "falcon:activeOrgId",
}: ActiveOrganizationProviderProps) {
  const { client } = useFalconAuthContext();
  const { data: orgsData, isPending } = client.useListOrganizations();

  const orgs = useMemo(() => {
    const raw = orgsData ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const out: FalconActiveOrganizationItem[] = [];
    for (const row of list) {
      const item = toOrgItem(row);
      if (item) out.push(item);
    }
    return out;
  }, [orgsData]);

  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });

  const didInit = useRef(false);

  useEffect(() => {
    if (isPending || !orgs.length || didInit.current) return;
    didInit.current = true;

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      stored = null;
    }

    const validStored = stored && orgs.some((o) => o.id === stored) ? stored : null;
    const targetId = validStored ?? orgs[0]!.id;

    setActiveOrgId(targetId);
    try {
      window.localStorage.setItem(storageKey, targetId);
    } catch {
      /* ignore quota / private mode */
    }
    client.organization.setActive({ organizationId: targetId }).catch(() => {});
  }, [isPending, orgs, client, storageKey]);

  const switchOrg = useCallback(
    async (organizationId: string) => {
      setActiveOrgId(organizationId);
      try {
        window.localStorage.setItem(storageKey, organizationId);
      } catch {
        /* ignore */
      }
      await client.organization.setActive({ organizationId });
    },
    [client, storageKey],
  );

  const activeOrg = useMemo(
    () => orgs.find((o) => o.id === activeOrgId) ?? null,
    [orgs, activeOrgId],
  );

  const value = useMemo<ActiveOrganizationContextValue>(
    () => ({
      activeOrg,
      orgs,
      isLoading: isPending,
      switchOrg,
    }),
    [activeOrg, orgs, isPending, switchOrg],
  );

  return (
    <ActiveOrganizationContext.Provider value={value}>{children}</ActiveOrganizationContext.Provider>
  );
}

export function useActiveOrganization(): ActiveOrganizationContextValue {
  const ctx = useContext(ActiveOrganizationContext);
  if (!ctx) {
    throw new Error(
      "useActiveOrganization must be used within <ActiveOrganizationProvider> inside <FalconAuthProvider>.",
    );
  }
  return ctx;
}
