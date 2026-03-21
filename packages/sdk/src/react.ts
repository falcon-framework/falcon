// React entry point — provider, hooks, and pre-built components
export { FalconAuthProvider, type FalconAuthProviderProps } from "./react/provider";
export { useFalconAuth, useUser, useSession } from "./react/hooks";
export {
  ActiveOrganizationProvider,
  useActiveOrganization,
  type ActiveOrganizationProviderProps,
  type ActiveOrganizationContextValue,
  type FalconActiveOrganizationItem,
} from "./react/active-organization";
export { SignIn, type SignInProps } from "./react/components/sign-in";
export { SignUp, type SignUpProps } from "./react/components/sign-up";
export { UserButton, type UserButtonProps } from "./react/components/user-button";
export {
  OrganizationSwitcher,
  type OrganizationSwitcherProps,
} from "./react/components/organization-switcher";

// Re-export core types for convenience
export type {
  FalconAuthConfig,
  FalconAuthState,
  FalconSession,
  FalconUser,
} from "./core/types";
export { createFalconAuthClient as createFalconAuth } from "./core/client";
