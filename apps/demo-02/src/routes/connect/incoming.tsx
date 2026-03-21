import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SignIn, useFalconAuth } from "@falcon-framework/sdk/react";
import { useConnectClient } from "#/hooks/use-connect-client";
import { useActiveOrg } from "#/providers/active-org";
import { demoEnv } from "#/lib/demo-env";
import type { InstallationRequestItem } from "#/lib/connect-client";
import { useEffect, useMemo, useState } from "react";

const PENDING_CONNECT_KEY = "falcon-demo02:pendingConnect";

function isAllowedReturnUrl(url: string, allowedOrigin: string): boolean {
  try {
    return new URL(url).origin === new URL(allowedOrigin).origin;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/connect/incoming")({
  validateSearch: (raw: Record<string, unknown>) => ({
    returnUrl: typeof raw.returnUrl === "string" ? raw.returnUrl : "",
    requestId: typeof raw.requestId === "string" ? raw.requestId : "",
  }),
  component: IncomingPage,
});

function IncomingPage() {
  const { returnUrl, requestId } = Route.useSearch();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useFalconAuth();
  const { orgs, isLoading: orgLoading } = useActiveOrg();
  const connect = useConnectClient();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingRow, setPendingRow] = useState<InstallationRequestItem | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done">("idle");

  const resumeUrl = useMemo(() => {
    const q = new URLSearchParams();
    if (returnUrl) q.set("returnUrl", returnUrl);
    if (requestId) q.set("requestId", requestId);
    return `/connect/incoming?${q.toString()}`;
  }, [returnUrl, requestId]);

  const returnOk =
    returnUrl && requestId && isAllowedReturnUrl(returnUrl, demoEnv.VITE_PEER_APP_ORIGIN);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || orgLoading) return;
    if (orgs.length === 0 && returnOk) {
      sessionStorage.setItem(PENDING_CONNECT_KEY, resumeUrl);
      void navigate({ to: "/org/create" });
    }
  }, [isLoaded, isSignedIn, orgLoading, orgs.length, returnOk, resumeUrl, navigate]);

  useEffect(() => {
    if (!returnOk || !connect || !requestId) {
      setLoadState("done");
      return;
    }
    if (!isSignedIn || orgLoading || orgs.length === 0) return;

    setLoadState("loading");
    setError(null);
    connect.installationRequests
      .list()
      .then((list) => {
        const row = list.find((r) => r.id === requestId) ?? null;
        setPendingRow(row);
        setLoadState("done");
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoadState("done");
      });
  }, [returnOk, connect, requestId, isSignedIn, orgLoading, orgs.length]);

  async function onApprove() {
    if (!connect || !requestId || !returnUrl) return;
    setBusy(true);
    setError(null);
    try {
      await connect.installationRequests.approve(requestId);
      window.location.href = returnUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  if (!returnUrl || !requestId) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">
          Missing <code>returnUrl</code> or <code>requestId</code> query parameters.
        </p>
      </main>
    );
  }

  if (!isAllowedReturnUrl(returnUrl, demoEnv.VITE_PEER_APP_ORIGIN)) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">
          The return URL is not allowed (must match the source app origin{" "}
          <code className="rounded bg-[var(--chip-bg)] px-1">{demoEnv.VITE_PEER_APP_ORIGIN}</code>
          ).
        </p>
      </main>
    );
  }

  if (!isLoaded) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">Loading…</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
          Sign in with the same Falcon Auth account you used on the source app, then approve the
          installation.
        </p>
        <SignIn afterSignInUrl={resumeUrl} signUpUrl="/sign-up" />
      </main>
    );
  }

  if (orgLoading || (orgs.length === 0 && returnOk)) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">Loading…</p>
      </main>
    );
  }

  if (orgs.length === 0) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="mb-4 text-[var(--sea-ink)]">You need a workspace.</p>
        <Link to="/org/create" className="font-semibold text-[var(--lagoon-deep)] underline">
          Create workspace
        </Link>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-sm text-red-700">{error}</p>
      </main>
    );
  }

  if (loadState !== "done") {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">Loading request…</p>
      </main>
    );
  }

  if (!pendingRow) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">
          No pending installation request found for this id. It may already be approved or expired.
        </p>
      </main>
    );
  }

  if (
    pendingRow.targetAppId !== demoEnv.VITE_FALCON_APP_ID ||
    pendingRow.sourceAppId !== demoEnv.VITE_PEER_APP_ID
  ) {
    return (
      <main className="page-wrap px-4 py-12">
        <p className="text-[var(--sea-ink-soft)]">
          This request does not match this demo app configuration (source/target app ids).
        </p>
      </main>
    );
  }

  return (
    <main className="page-wrap px-4 py-12">
      <div className="island-shell max-w-lg rounded-2xl p-8">
        <p className="island-kicker mb-2">Target app</p>
        <h1 className="mb-3 text-2xl font-bold text-[var(--sea-ink)]">Approve connection</h1>
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          The source app requested to connect with scopes:{" "}
          <code className="rounded bg-[var(--chip-bg)] px-1 text-xs">
            {pendingRow.requestedScopes.join(", ") || "(none)"}
          </code>
        </p>
        <button
          type="button"
          disabled={busy || !connect}
          onClick={() => void onApprove()}
          className="rounded-full bg-[var(--lagoon)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Approving…" : "Approve and return to source app"}
        </button>
      </div>
    </main>
  );
}
