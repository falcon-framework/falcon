import { useState, useRef, useEffect } from "react";
import { useFalconAuth } from "../hooks";

export interface UserButtonProps {
  /** URL to navigate to after signing out */
  afterSignOutUrl?: string;
  /** Additional CSS class for the root container */
  className?: string;
}

/**
 * Pre-built user button component.
 *
 * Shows the current user's avatar/initials. Clicking opens a dropdown
 * with user info and a sign-out action. Styled with Tailwind CSS.
 * Must be used within a `<FalconAuthProvider>`.
 *
 * @example
 * ```tsx
 * import { UserButton } from "@falcon-framework/sdk/react";
 *
 * function Header() {
 *   return (
 *     <nav>
 *       <UserButton afterSignOutUrl="/sign-in" />
 *     </nav>
 *   );
 * }
 * ```
 */
export function UserButton({ afterSignOutUrl, className }: UserButtonProps) {
  const { user, isLoaded, isSignedIn, signOut } = useFalconAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoaded) {
    return <div className={`h-8 w-8 animate-pulse rounded-full bg-muted ${className ?? ""}`} />;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    if (afterSignOutUrl && typeof window !== "undefined") {
      window.location.href = afterSignOutUrl;
    }
  };

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="User menu"
      >
        {user.image ? (
          <img src={user.image} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center rounded-md px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
