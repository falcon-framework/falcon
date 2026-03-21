export { createFalconAuthClient as createFalconAuth } from "./core/client";
export type { FalconAuthClient } from "./core/client";
export type { FalconAuthConfig, FalconAuthState, FalconSession, FalconUser } from "./core/types";
export {
  buildSignInUrl,
  buildSignUpUrl,
  redirectToSignIn,
  redirectToSignUp,
  exchangeCodeForSession,
} from "./core/redirect";
export type { RedirectToSignInOptions, ExchangeCodeOptions, ExchangeCodeResult } from "./core/redirect";
export { sessionCookieName } from "./core/cookie";
