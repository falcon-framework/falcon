import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SignIn, useFalconAuth } from "@falcon-framework/sdk/react";

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

function SignInPage() {
  const { isSignedIn } = useFalconAuth();
  if (isSignedIn) {
    return (
      <main className="page-wrap px-4 py-12">
        <p>You are already signed in</p>
        <Navigate to="/dashboard" />
      </main>
    );
  }
  return (
    <main className="page-wrap px-4 py-12">
      <SignIn afterSignInUrl="/dashboard" signUpUrl="/sign-up" />
    </main>
  );
}
