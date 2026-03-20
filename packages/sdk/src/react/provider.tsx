import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createFalconAuthClient, type FalconAuthClient } from "../core/client";
import type { FalconAuthConfig } from "../core/types";

interface FalconAuthContextValue {
  client: FalconAuthClient;
  config: FalconAuthConfig;
}

const FalconAuthContext = createContext<FalconAuthContextValue | null>(null);

export interface FalconAuthProviderProps {
  /** Config object or a pre-created client from createFalconAuth() */
  config: FalconAuthConfig;
  children: ReactNode;
}

/**
 * Provides Falcon Auth context to your app.
 *
 * @example
 * ```tsx
 * import { FalconAuthProvider } from "@falcon-framework/sdk/react";
 *
 * function App() {
 *   return (
 *     <FalconAuthProvider config={{ serverUrl: "...", publishableKey: "pk_..." }}>
 *       <YourApp />
 *     </FalconAuthProvider>
 *   );
 * }
 * ```
 */
export function FalconAuthProvider({ config, children }: FalconAuthProviderProps) {
  const value = useMemo(() => {
    const client = createFalconAuthClient(config);
    return { client, config };
  }, [config.serverUrl, config.publishableKey]);

  return (
    <FalconAuthContext.Provider value={value}>
      {children}
    </FalconAuthContext.Provider>
  );
}

export function useFalconAuthContext(): FalconAuthContextValue {
  const ctx = useContext(FalconAuthContext);
  if (!ctx) {
    throw new Error(
      "useFalconAuth must be used within a <FalconAuthProvider>. " +
      "Wrap your app with <FalconAuthProvider config={...}>."
    );
  }
  return ctx;
}
