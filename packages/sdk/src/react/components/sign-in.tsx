import { useState, type FormEvent } from "react";
import { useFalconAuthContext } from "../provider";

export interface SignInProps {
  /** URL to navigate to after successful sign-in */
  afterSignInUrl?: string;
  /** URL or callback to switch to the sign-up form */
  signUpUrl?: string;
  /** Called after successful sign-in */
  onSignIn?: () => void;
  /** Additional CSS class for the root container */
  className?: string;
}

/**
 * Pre-built sign-in form component.
 *
 * Renders an email + password form styled with Tailwind CSS.
 * Must be used within a `<FalconAuthProvider>`.
 *
 * @example
 * ```tsx
 * import { SignIn } from "@falcon-framework/sdk/react";
 *
 * function LoginPage() {
 *   return <SignIn afterSignInUrl="/dashboard" signUpUrl="/sign-up" />;
 * }
 * ```
 */
export function SignIn({ afterSignInUrl, signUpUrl, onSignIn, className }: SignInProps) {
  const { client } = useFalconAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await client.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
        return;
      }
      onSignIn?.();
      if (afterSignInUrl && typeof window !== "undefined") {
        window.location.href = afterSignInUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`mx-auto w-full max-w-sm ${className ?? ""}`}>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="falcon-signin-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="falcon-signin-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="falcon-signin-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="falcon-signin-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {signUpUrl && (
          <div className="mt-4 border-t border-border pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href={signUpUrl} className="text-primary underline-offset-4 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
