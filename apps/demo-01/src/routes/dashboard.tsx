import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFalconAuth } from '@falcon-framework/sdk/react'
import { useConnectClient } from '#/hooks/use-connect-client'
import { useActiveOrg } from '#/providers/active-org'
import { demoEnv } from '#/lib/demo-env'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const { isLoaded, isSignedIn } = useFalconAuth()
  const { orgs, isLoading: orgLoading } = useActiveOrg()
  const connect = useConnectClient()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      void navigate({ to: '/sign-in' })
    }
  }, [isLoaded, isSignedIn, navigate])

  useEffect(() => {
    if (!isLoaded || !isSignedIn || orgLoading) return
    if (orgs.length === 0) {
      void navigate({ to: '/org/create' })
    }
  }, [isLoaded, isSignedIn, orgLoading, orgs.length, navigate])

  async function startConnect() {
    if (!connect) return
    setBusy(true)
    setError(null)
    try {
      const caps = await connect.apps.capabilities(demoEnv.VITE_PEER_APP_ID)
      const requestedScopes =
        caps.length > 0 ? caps.map((c) => c.scopeKey) : ['demo.read']
      const inst = await connect.installationRequests.create({
        sourceAppId: demoEnv.VITE_FALCON_APP_ID,
        targetAppId: demoEnv.VITE_PEER_APP_ID,
        requestedScopes,
      })
      const returnUrl = `${window.location.origin}/connect/done`
      const target = `${demoEnv.VITE_PEER_APP_ORIGIN}/connect/incoming?returnUrl=${encodeURIComponent(returnUrl)}&requestId=${encodeURIComponent(inst.id)}`
      window.location.href = target
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not start connection flow',
      )
    } finally {
      setBusy(false)
    }
  }

  if (!isLoaded || !isSignedIn || orgLoading || orgs.length === 0) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">Loading…</p>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-12">
      <div className="island-shell max-w-2xl rounded-2xl p-8">
        <p className="island-kicker mb-2">Source app (demo-01)</p>
        <h1 className="mb-3 text-2xl font-bold text-[var(--sea-ink)]">
          Connect to the partner app
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          This uses Falcon Auth for sign-in and Falcon Connect to create an
          installation request. You will be sent to the target app on port{' '}
          <code className="rounded bg-[var(--chip-bg)] px-1">3011</code> to
          approve the connection, then returned here.
        </p>
        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={!connect || busy}
          onClick={() => void startConnect()}
          className="rounded-full bg-[var(--lagoon)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
        >
          {busy ? 'Starting…' : 'Connect to partner app'}
        </button>
      </div>
    </main>
  )
}
