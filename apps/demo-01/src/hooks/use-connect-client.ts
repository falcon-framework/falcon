import { makeConnectClient } from '#/lib/connect-client'
import { useActiveOrg } from '#/providers/active-org'
import { useHydrated } from '#/hooks/use-hydrated'
import { useMemo } from 'react'

export function useConnectClient() {
  const { activeOrg, isLoading } = useActiveOrg()
  const hydrated = useHydrated()

  return useMemo(
    () =>
      hydrated && !isLoading && activeOrg?.id
        ? makeConnectClient(activeOrg.id)
        : null,
    [hydrated, isLoading, activeOrg?.id],
  )
}
