import { createFileRoute, Link } from '@tanstack/react-router'
import { useFalconAuth } from '@falcon-framework/sdk/react'
import {
  resolveFalconConnectionsDisplay,
  type FalconConnectConnectionDisplay,
} from '@falcon-framework/sdk/connect'
import { useConnectClient } from '#/hooks/use-connect-client'
import { ConnectionListItem } from '#/components/connection-list-item'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/connect/done')({
  component: ConnectDonePage,
})

function ConnectDonePage() {
  const { isSignedIn, isLoaded } = useFalconAuth()
  const connect = useConnectClient()
  const [list, setList] = useState<FalconConnectConnectionDisplay[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!connect) return
    resolveFalconConnectionsDisplay(
      () => connect.apps.list(),
      () => connect.connections.list(),
    )
      .then(setList)
      .catch((e: Error) => setLoadError(e.message))
  }, [connect])

  return (
    <main className="page-wrap px-4 py-12">
      <div className="island-shell max-w-2xl rounded-2xl p-8">
        <p className="island-kicker mb-2">Source app</p>
        <h1 className="mb-3 text-2xl font-bold text-[var(--sea-ink)]">
          You are back from the partner app
        </h1>
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          If the target app approved the installation, the connection should
          appear below.
        </p>
        {!isLoaded ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
        ) : !isSignedIn ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            <Link to="/sign-in" className="text-[var(--lagoon-deep)] underline">
              Sign in
            </Link>{' '}
            to load connections.
          </p>
        ) : loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : list === null ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading connections…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            No connections yet. Try the flow again from the dashboard.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {list.map((c) => (
              <ConnectionListItem key={c.id} c={c} />
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-[var(--lagoon-deep)] underline"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
