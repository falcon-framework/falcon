import { FalconAuthProvider } from "@falcon-framework/sdk/react";
import { falconAuthConfig } from "#/lib/demo-env";
import { ActiveOrgProvider } from "#/providers/active-org";

export function FalconShell({ children }: { children: React.ReactNode }) {
  return (
    <FalconAuthProvider config={falconAuthConfig}>
      <ActiveOrgProvider>{children}</ActiveOrgProvider>
    </FalconAuthProvider>
  );
}
