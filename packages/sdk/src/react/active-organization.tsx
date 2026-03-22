import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FalconAuthClient } from "../core/client";
import { normalizeOrgListRow, type FalconOrgListItem } from "./org-normalize";
import { useFalconAuthContextOptional } from "./provider";

export type FalconActiveOrganizationItem = FalconOrgListItem;

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
  /**
   * Better Auth React client with the organization plugin (e.g. `createAuthClient` or `createFalconAuth`).
   * Pass this when the tree is not wrapped with `FalconAuthProvider`.
   */
  client?: FalconAuthClient;
}

/**
 * Keeps a **selected organization** in sync with Better Auth (`organization.setActive`) and `localStorage`.
 * Either wrap with {@link FalconAuthProvider} or pass a **`client`** prop (Better Auth React client with `organizationClient()`).
 */
export function ActiveOrganizationProvider({
  children,
  storageKey = "falcon:activeOrgId",
  client: clientProp,
}: ActiveOrganizationProviderProps) {
  const contextValue = useFalconAuthContextOptional();
  const client = clientProp ?? contextValue?.client;
  if (!client) {
    throw new Error(
      "ActiveOrganizationProvider requires a `client` prop or an ancestor <FalconAuthProvider>.",
    );
  }
  const { data: orgsData, isPending } = client.useListOrganizations();

  const orgs = useMemo(() => {
    const raw = orgsData ?? [];
    const list = Array.isArray(raw) ? raw : [];
    const out: FalconActiveOrganizationItem[] = [];
    for (const row of list) {
      const item = normalizeOrgListRow(row);
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

  /**
   * Keep React state in sync with `localStorage` and the org list. Runs again when the list
   * updates (e.g. after creating an org on another route that writes `storageKey` and `setActive`).
   */
  useEffect(() => {
    if (isPending || !orgs.length) return;

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      stored = null;
    }

    // If localStorage already points at an org that is not in the list yet, wait for the query to
    // refresh (e.g. after creating an org on another route). Do not fall back to orgs[0] or we
    // briefly show the wrong active org.
    if (stored && !orgs.some((o) => o.id === stored)) {
      return;
    }

    const validStored = stored && orgs.some((o) => o.id === stored) ? stored : null;
    const targetId = validStored ?? orgs[0]!.id;

    setActiveOrgId((prev) => {
      if (prev === targetId) return prev;
      try {
        window.localStorage.setItem(storageKey, targetId);
      } catch {
        /* ignore quota / private mode */
      }
      client.organization.setActive({ organizationId: targetId }).catch(() => {});
      return targetId;
    });
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
    <ActiveOrganizationContext.Provider value={value}>
      {children}
    </ActiveOrganizationContext.Provider>
  );
}

export function useActiveOrganization(): ActiveOrganizationContextValue {
  const ctx = useContext(ActiveOrganizationContext);
  if (!ctx) {
    throw new Error(
      "useActiveOrganization must be used within <ActiveOrganizationProvider> (with <FalconAuthProvider> or a `client` prop on the provider).",
    );
  }
  return ctx;
}
