# Organizations in the JavaScript SDK

Falcon Auth runs Better Auth’s **organization** plugin. The SDK turns it on by default on **`createFalconAuth`**, so your app can manage tenants (membership, roles, active org) and send the correct **`X-Organization-Id`** to [Falcon Connect](../falcon-connect/authentication.md).

## What you get out of the box

| API                                                                      | Purpose                                                                                                                                                                                  |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`organizationClient`** (re-exported from `better-auth/client/plugins`) | Already registered on the Falcon client—you rarely import this directly.                                                                                                                 |
| **`client.organization.*`** on the React client                          | Create/update orgs, invite members, **`setActive`**, etc. (Better Auth API).                                                                                                             |
| **`client.useListOrganizations()`** and related hooks                    | Reactive org lists and active-org state from Better Auth.                                                                                                                                |
| **`ActiveOrganizationProvider`** / **`useActiveOrganization`**           | Opinionated **active org** selection synced to **`localStorage`** and **`organization.setActive`**.                                                                                      |
| **`OrganizationSwitcher`**                                               | Tailwind dropdown to switch orgs (optional links to settings / create).                                                                                                                  |
| **`buildFalconConnectHeaders`**                                          | Pure helper for **`X-Falcon-App-Id`** + **`X-Organization-Id`** on Connect `fetch` calls.                                                                                                |
| Session types                                                            | **`FalconSession.activeOrganizationId`**, optional **`activeOrganization`** / **`organizations`** on **`fetchFalconSession`** and **`verifySession`** when the auth server returns them. |

The monorepo **demo-01** and **demo-02** apps render **`OrganizationSwitcher`** in the header (via `DemoOrgSwitcher`) whenever you are signed in and have at least one organization—use them as a live reference when running the stack locally.

## Install and provider tree

```tsx
import { FalconAuthProvider, ActiveOrganizationProvider } from "@falcon-framework/sdk/react";

export function App() {
  return (
    <FalconAuthProvider config={config}>
      <ActiveOrganizationProvider storageKey="myapp:activeOrgId">
        <Shell />
      </ActiveOrganizationProvider>
    </FalconAuthProvider>
  );
}
```

**`ActiveOrganizationProvider`** needs a Better Auth client with the organization plugin: wrap with **`FalconAuthProvider`**, **or** pass **`client={yourAuthClient}`** when you use `createAuthClient` from `better-auth/react` directly (for example the FALCON console). It uses **`localStorage`** (browser-only); use it in client-rendered routes.

## Using the active organization hook

```tsx
import { useActiveOrganization } from "@falcon-framework/sdk/react";

function ConnectToolbar() {
  const { activeOrg, orgs, isLoading, switchOrg } = useActiveOrganization();

  if (isLoading) return <span>Loading…</span>;
  if (!activeOrg) return <span>No organization</span>;

  return (
    <button type="button" onClick={() => void switchOrg(orgs[1]!.id)}>
      Switch away from {activeOrg.name}
    </button>
  );
}
```

## Connect API headers from the browser

Falcon Connect requires **`X-Organization-Id`** on every call. Use your publishable key and the **Better Auth organization id** (the same id as the active org in the UI):

```ts
import { buildFalconConnectHeaders } from "@falcon-framework/sdk";

const headers = buildFalconConnectHeaders({
  publishableKey: config.publishableKey,
  organizationId: activeOrgId,
  init: { "Content-Type": "application/json" },
});

await fetch(`${connectBase}/v1/connections`, {
  credentials: "include",
  headers,
});
```

See [Calling the Connect API](../falcon-connect/authentication.md) for session cookies, CORS, and roles.

## Optional: `OrganizationSwitcher` component

Drop-in UI (Tailwind) for switching orgs; optional **`settingsHref`** / **`createOrganizationHref`** or **`onOpenSettings`** / **`onCreateOrganization`** for navigation without coupling to a specific router.

```tsx
import { OrganizationSwitcher } from "@falcon-framework/sdk/react";

<OrganizationSwitcher createOrganizationHref="/org/create" settingsHref="/org/settings" />;
```

## Session and server verification

- **`fetchFalconSession`** returns **`FalconSessionResponse`**, which includes optional **`activeOrganization`** / **`organizations`** when the auth server includes them on **`GET /api/auth/get-session`**.
- **`verifySession`** (from **`@falcon-framework/sdk/server`**) forwards the same payload shape: **`VerifiedSession.session.activeOrganizationId`** and optional top-level org fields.

Connect still enforces **membership** for the requested org; verifying the Falcon session does not replace **`X-Organization-Id`** checks on Connect.

## Related topics

- [Organizations (Falcon Auth)](../falcon-auth/organizations.md)
- [React integration](react-integration.md)
- [Server session verification](server-verification.md)
- [Calling the Connect API](../falcon-connect/authentication.md)
