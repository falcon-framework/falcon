import { Link } from "@tanstack/react-router";
import { useFalconAuth, UserButton } from "@falcon-framework/sdk/react";

export default function FalconHeaderUser() {
  const { isLoaded, isSignedIn } = useFalconAuth();

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--muted)]" />;
  }

  if (!isSignedIn) {
    return (
      <Link
        to="/sign-in"
        className="inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-4 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
      >
        Sign in
      </Link>
    );
  }

  return <UserButton afterSignOutUrl="/" className="shrink-0" />;
}
