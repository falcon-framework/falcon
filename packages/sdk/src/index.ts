export { createFalconAuthClient as createFalconAuth } from "./core/client";
export type { FalconAuthClient } from "./core/client";
export type {
  FalconAuthConfig,
  FalconAuthState,
  FalconOrganizationSummary,
  FalconSession,
  FalconSessionResponse,
  FalconUser,
} from "./core/types";
export { organizationClient } from "better-auth/client/plugins";
export { fetchFalconSession, signOutFalconSession } from "./core/session";
export { buildFalconConnectHeaders } from "./core/connect-headers";
export {
  buildSignInUrl,
  buildSignUpUrl,
  redirectToSignIn,
  redirectToSignUp,
  exchangeCodeForSession,
} from "./core/redirect";
export type {
  RedirectToSignInOptions,
  ExchangeCodeOptions,
  ExchangeCodeResult,
} from "./core/redirect";
export { sessionCookieName } from "./core/cookie";
export { completeAuthCallback } from "./core/auth-callback";
export type { CompleteAuthCallbackOptions, SessionLookupResult } from "./core/auth-callback";
