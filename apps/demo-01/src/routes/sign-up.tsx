import { createFileRoute, Navigate } from "@tanstack/react-router";
import { redirectToSignUp } from "@falcon-framework/sdk";
import { useFalconAuth } from "@falcon-framework/sdk/react";
import { falconAuthConfig } from "#/lib/demo-env";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const { isSignedIn } = useFalconAuth();
  if (isSignedIn) {
    return <Navigate to="/dashboard" />;
  }

  function handleSignUp() {
    const state = crypto.randomUUID();
    sessionStorage.setItem("falcon_auth_state", state);
    redirectToSignUp(falconAuthConfig, {
      redirectUri: `${window.location.origin}/auth/callback`,
      state,
    });
  }

  return (
    <main className="page-wrap px-4 py-12">
      <div className="mx-auto w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--lagoon-deep)]">
            Falcon Auth
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Create account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You will be redirected to Falcon Auth to create your account.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignUp}
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Continue to Falcon Auth
        </button>
      </div>
    </main>
  );
}
