import { createFileRoute, Link } from "@tanstack/react-router";
import { useFalconAuth } from "@falcon-framework/sdk/react";
import {
  resolveFalconConnectionsDisplay,
  type FalconConnectConnectionDisplay,
} from "@falcon-framework/sdk/connect";
import { useConnectClient } from "#/hooks/use-connect-client";
import { demoEnv } from "#/lib/demo-env";
import { ConnectionListItem } from "#/components/connection-list-item";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/connections")({
  component: ConnectionsPage,
});

function ConnectionsPage() {
  const { isSignedIn, isLoaded } = useFalconAuth();
  const connect = useConnectClient();
  const [list, setList] = useState<FalconConnectConnectionDisplay[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selfId = demoEnv.VITE_FALCON_APP_ID;

  useEffect(() => {
    if (!connect) return;
    resolveFalconConnectionsDisplay(
      () => connect.apps.list(),
      () => connect.connections.list(),
    )
      .then(setList)
      .catch((e: Error) => setLoadError(e.message));
  }, [connect]);

  const incoming = useMemo(
    () => (list ?? []).filter((c) => c.targetAppId === selfId),
    [list, selfId],
  );
  const outgoing = useMemo(
    () => (list ?? []).filter((c) => c.sourceAppId === selfId),
    [list, selfId],
  );

  function renderRows(rows: FalconConnectConnectionDisplay[]) {
    if (rows.length === 0) {
      return <p className="text-sm text-[var(--sea-ink-soft)]">None yet.</p>;
    }
    return (
      <ul className="space-y-3 text-sm">
        {rows.map((c) => (
          <ConnectionListItem key={c.id} c={c} />
        ))}
      </ul>
    );
  }

  return (
    <main className="page-wrap px-4 py-12">
      <div className="island-shell max-w-2xl rounded-2xl p-8">
        <p className="island-kicker mb-2">Target app</p>
        <h1 className="mb-3 text-2xl font-bold text-[var(--sea-ink)]">Connections</h1>
        <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
          Apps linked to your organization via Falcon Connect. Names come from the platform app
          directory (<code className="rounded bg-[var(--chip-bg)] px-1 text-xs">GET /v1/apps</code>
          ).
        </p>

        {!isLoaded ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading…</p>
        ) : !isSignedIn ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            <Link to="/sign-in" className="text-[var(--lagoon-deep)] underline">
              Sign in
            </Link>{" "}
            to view connections.
          </p>
        ) : loadError ? (
          <p className="text-sm text-red-700">{loadError}</p>
        ) : list === null ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">Loading connections…</p>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
                Apps connected to this application
              </h2>
              <p className="mb-4 text-xs text-[var(--sea-ink-soft)]">
                Source apps that installed into this target (you approved these).
              </p>
              {renderRows(incoming)}
            </section>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--sea-ink)]">
                Connections this app started
              </h2>
              <p className="mb-4 text-xs text-[var(--sea-ink-soft)]">
                If this app initiated an install to another target, it appears here.
              </p>
              {renderRows(outgoing)}
            </section>
          </div>
        )}

        <div className="mt-10">
          <Link to="/" className="text-sm font-semibold text-[var(--lagoon-deep)] underline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
