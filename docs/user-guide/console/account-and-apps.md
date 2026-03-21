# Account, profile, and connected apps

The console’s **account** area is where a signed-in user reviews their **profile** and manages aspects of their relationship with Falcon.

## Profile

Users can see their **name**, **email**, and account metadata (for example member since). Name updates flow through the same Better Auth client the console uses elsewhere; exact fields depend on your Better Auth configuration.

## Connected Falcon Auth apps

The console lists **applications you have signed into** through Falcon Auth (rows linked via **`app_user`**). For each entry you typically see:

- **Application name** (from **`falcon_auth_app.name`**).
- **When** the link was created (connected timestamp).

### Revoking access

Users may **revoke** their link to an app. That removes the association for future directory purposes; the third-party app may still hold its own data and should handle “account disconnected” in its product logic if required.

This control is **user-centric** (like “remove this app from my account”), not the same as revoking a **Connect** relationship between two products (that lives under [Connections](connections.md)).

## SDK documentation surface

The console may embed a **developer-focused** page (installation, provider, components, hooks, server helpers, registration notes). That content targets **integrators** who ship code against `@falcon-framework/sdk`.

End-user documentation for “how to use my company’s portal” usually lives separately from SDK API details; this **user guide** is the narrative complement.

## Sign-in experience

The console signs in **directly** against the auth server from its own origin (embedded login in the console SPA). Your customer-facing apps may instead use **hosted** sign-in; both patterns share the same user database when pointed at the same **`BETTER_AUTH_URL`**.

See [Centralized sign-in](../falcon-auth/centralized-sign-in.md).

## Related topics

- [Organizations](organizations.md)
- [React integration](../sdk/react-integration.md)
