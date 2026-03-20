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
  const { client } = useFalconAuthContext();
  const sessionQuery = client.useSession();

  const user = sessionQuery.data?.user ?? null;
  const session = sessionQuery.data?.session ?? null;
  const isLoaded = !sessionQuery.isPending;
  const isSignedIn = isLoaded && !!user;

  return {
    user,
    session,
    isLoaded,
    isSignedIn,
    signOut: client.signOut,
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
