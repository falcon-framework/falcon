import { useState, type FormEvent } from "react";
import { useFalconAuthContext } from "../provider";

export interface SignUpProps {
  /** URL to navigate to after successful sign-up */
  afterSignUpUrl?: string;
  /** URL or callback to switch to the sign-in form */
  signInUrl?: string;
  /** Called after successful sign-up */
  onSignUp?: () => void;
  /** Additional CSS class for the root container */
  className?: string;
}

/**
 * Pre-built sign-up form component.
 *
 * Renders a name + email + password form styled with Tailwind CSS.
 * Must be used within a `<FalconAuthProvider>`.
 *
 * @example
 * ```tsx
 * import { SignUp } from "@falcon-framework/sdk/react";
 *
 * function RegisterPage() {
 *   return <SignUp afterSignUpUrl="/dashboard" signInUrl="/sign-in" />;
 * }
 * ```
 */
export function SignUp({ afterSignUpUrl, signInUrl, onSignUp, className }: SignUpProps) {
  const { client } = useFalconAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await client.signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
        return;
      }
      onSignUp?.();
      if (afterSignUpUrl && typeof window !== "undefined") {
        window.location.href = afterSignUpUrl;
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
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Create account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started with your new account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="falcon-signup-name" className="text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id="falcon-signup-name"
              type="text"
              required
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="falcon-signup-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="falcon-signup-email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="falcon-signup-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="falcon-signup-password"
              type="password"
              required
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        {signInUrl && (
          <div className="mt-4 border-t border-border pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <a
                href={signInUrl}
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
