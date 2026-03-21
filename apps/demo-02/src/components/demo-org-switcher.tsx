import { OrganizationSwitcher, useFalconAuth } from "@falcon-framework/sdk/react";
import { useActiveOrg } from "#/providers/active-org";

/** SDK `OrganizationSwitcher` — shown when the user has at least one org (live Falcon Auth + Connect demo). */
export function DemoOrgSwitcher() {
  const { isLoaded, isSignedIn } = useFalconAuth();
  const { orgs, isLoading } = useActiveOrg();

  if (!isLoaded || !isSignedIn || isLoading || orgs.length === 0) {
    return null;
  }

  return (
    <div data-testid="demo-org-switcher" className="shrink-0">
      <OrganizationSwitcher createOrganizationHref="/org/create" className="max-w-[12rem]" />
    </div>
  );
}
