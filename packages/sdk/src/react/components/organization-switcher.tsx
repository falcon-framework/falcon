import { useEffect, useRef, useState } from "react";
import { useFalconAuth } from "../hooks";
import { useActiveOrganization } from "../active-organization";

export interface OrganizationSwitcherProps {
  className?: string;
  /** Shown on the trigger when no organization name is available */
  placeholder?: string;
  /** Shown in the menu when the user has no organizations */
  emptyMessage?: string;
  /** Link destination for “Organization settings” */
  settingsHref?: string;
  /** Called when “Organization settings” is chosen (used with or without settingsHref) */
  onOpenSettings?: () => void;
  /** Link destination for “Create organization” */
  createOrganizationHref?: string;
  /** Called when “Create organization” is chosen */
  onCreateOrganization?: () => void;
}

/**
 * Minimal organization switcher (Tailwind). Requires {@link ActiveOrganizationProvider} and a signed-in user.
 */
export function OrganizationSwitcher({
  className,
  placeholder = "Select organization",
  emptyMessage = "No organizations",
  settingsHref,
  onOpenSettings,
  createOrganizationHref,
  onCreateOrganization,
}: OrganizationSwitcherProps) {
  const { isLoaded, isSignedIn } = useFalconAuth();
  const { activeOrg, orgs, isLoading, switchOrg } = useActiveOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    return (
      <div
        className={`h-8 w-40 animate-pulse rounded-md bg-muted ${className ?? ""}`}
        aria-hidden
      />
    );
  }

  if (!isSignedIn) {
    return null;
  }

  const label = activeOrg?.name ?? placeholder;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex h-8 max-w-[12rem] items-center gap-1.5 rounded-md border border-border bg-background px-2 text-sm text-foreground ring-offset-background transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
          {(label[0] ?? "?").toUpperCase()}
        </span>
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <span className="text-muted-foreground" aria-hidden>
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-popover p-1 shadow-lg"
          role="menu"
        >
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Organizations</div>
          {orgs.length === 0 && (
            <div className="px-2 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
          )}
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
              onClick={() => {
                void switchOrg(org.id);
                setIsOpen(false);
              }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold">
                {org.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate">{org.name}</span>
              {activeOrg?.id === org.id && (
                <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">
                  Active
                </span>
              )}
            </button>
          ))}

          {(onOpenSettings || settingsHref) && (
            <>
              <div className="my-1 h-px bg-border" />
              {settingsHref ? (
                <a
                  href={settingsHref}
                  className="block rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                  onClick={() => {
                    onOpenSettings?.();
                    setIsOpen(false);
                  }}
                >
                  Organization settings
                </a>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  onClick={() => {
                    onOpenSettings?.();
                    setIsOpen(false);
                  }}
                >
                  Organization settings
                </button>
              )}
            </>
          )}

          {(onCreateOrganization || createOrganizationHref) && (
            <>
              <div className="my-1 h-px bg-border" />
              {createOrganizationHref ? (
                <a
                  href={createOrganizationHref}
                  className="block rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
                  onClick={() => {
                    onCreateOrganization?.();
                    setIsOpen(false);
                  }}
                >
                  Create organization
                </a>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
                  onClick={() => {
                    onCreateOrganization?.();
                    setIsOpen(false);
                  }}
                >
                  Create organization
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
