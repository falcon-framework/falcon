import { useEffect, useState } from "react";
import { fetchFalconSession, signOutFalconSession } from "../core/session";
import type { FalconSession, FalconUser } from "../core/types";
import { useFalconAuthContext } from "./provider";

/**
 * Returns the full Falcon Auth state including user, session, loading state, and signOut.
 *
 * @example
 * ```tsx
 * const { user, session, isLoaded, isSignedIn, signOut } = useFalconAuth();
 * ```
 */
export function useFalconAuth() {
  const { client, config } = useFalconAuthContext();
  const [user, setUser] = useState<FalconUser | null>(null);
  const [session, setSession] = useState<FalconSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const data = await fetchFalconSession(config);
        if (cancelled) return;
        setUser(data?.user ?? null);
        setSession(data?.session ?? null);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    setIsLoaded(false);
    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [config.publishableKey, config.serverUrl]);

  const isSignedIn = isLoaded && !!user;

  return {
    user,
    session,
    isLoaded,
    isSignedIn,
    signOut: async () => {
      await signOutFalconSession(config);
      setUser(null);
      setSession(null);
    },
    client,
  };
}

/**
 * Returns the current user and loading state.
 *
 * @example
 * ```tsx
 * const { user, isLoaded } = useUser();
 * if (!isLoaded) return <Spinner />;
 * if (!user) return <SignIn />;
 * return <p>Hello, {user.name}</p>;
 * ```
 */
export function useUser() {
  const { user, isLoaded } = useFalconAuth();
  return { user, isLoaded };
}

/**
 * Returns the current session and loading state.
 *
 * @example
 * ```tsx
 * const { session, isLoaded } = useSession();
 * ```
 */
export function useSession() {
  const { session, isLoaded } = useFalconAuth();
  return { session, isLoaded };
}
