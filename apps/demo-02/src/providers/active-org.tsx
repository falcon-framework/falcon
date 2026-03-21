import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useFalconAuth } from '@falcon-framework/sdk/react'

const STORAGE_KEY = 'falcon-demo02:activeOrgId'

type OrgItem = { id: string; name: string; slug: string }

type ActiveOrgCtx = {
  activeOrg: OrgItem | null
  orgs: OrgItem[]
  isLoading: boolean
  switchOrg: (orgId: string) => Promise<void>
}

const ActiveOrgContext = createContext<ActiveOrgCtx>({
  activeOrg: null,
  orgs: [],
  isLoading: true,
  switchOrg: async () => {},
})

export function ActiveOrgProvider({ children }: { children: React.ReactNode }) {
  const { client } = useFalconAuth()
  const { data: orgsData, isPending } = client.useListOrganizations()
  const orgs = useMemo(
    () => (orgsData ?? []) as OrgItem[],
    [orgsData],
  )

  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEY)
  })

  const didInit = useRef(false)

  useEffect(() => {
    if (isPending || !orgs.length || didInit.current) return
    didInit.current = true

    const stored = localStorage.getItem(STORAGE_KEY)
    const validStored = stored && orgs.find((o) => o.id === stored) ? stored : null
    const targetId = validStored ?? orgs[0]!.id

    setActiveOrgId(targetId)
    localStorage.setItem(STORAGE_KEY, targetId)
    client.organization.setActive({ organizationId: targetId }).catch(() => {})
  }, [isPending, orgs, client])

  const switchOrg = useCallback(
    async (orgId: string) => {
      setActiveOrgId(orgId)
      localStorage.setItem(STORAGE_KEY, orgId)
      await client.organization.setActive({ organizationId: orgId })
    },
    [client],
  )

  const activeOrg = useMemo(
    () => orgs.find((o) => o.id === activeOrgId) ?? null,
    [orgs, activeOrgId],
  )

  const value = useMemo(
    () => ({
      activeOrg,
      orgs,
      isLoading: isPending,
      switchOrg,
    }),
    [activeOrg, orgs, isPending, switchOrg],
  )

  return (
    <ActiveOrgContext.Provider value={value}>{children}</ActiveOrgContext.Provider>
  )
}

export function useActiveOrg() {
  return useContext(ActiveOrgContext)
}
