import type { FalconAuthConfig } from "./types";

export interface RedirectToSignInOptions {
  /** The URL the auth server should redirect back to after sign-in. */
  redirectUri: string;
  /**
   * Opaque value used for CSRF protection.
   * Generate with `crypto.randomUUID()`, store in `sessionStorage`, and verify
   * in the callback handler before exchanging the code.
   */
  state?: string;
}

/**
 * Builds the URL that the user's browser should be sent to in order to sign in
 * via the Falcon Auth server.
 */
export function buildSignInUrl(config: FalconAuthConfig, options: RedirectToSignInOptions): string {
  const url = new URL(`${config.serverUrl}/auth/authorize`);
  url.searchParams.set("client_id", config.publishableKey);
  url.searchParams.set("redirect_uri", options.redirectUri);
  if (options.state) url.searchParams.set("state", options.state);
  return url.toString();
}

/**
 * Builds the URL that the user's browser should be sent to in order to create
 * an account via the Falcon Auth server.
 */
export function buildSignUpUrl(config: FalconAuthConfig, options: RedirectToSignInOptions): string {
  const url = new URL(`${config.serverUrl}/auth/sign-up`);
  url.searchParams.set("client_id", config.publishableKey);
  url.searchParams.set("redirect_uri", options.redirectUri);
  if (options.state) url.searchParams.set("state", options.state);
  return url.toString();
}

/**
 * Redirects the browser to the Falcon Auth sign-in page.
 * Must be called in a browser context (`window` must be available).
 */
export function redirectToSignIn(config: FalconAuthConfig, options: RedirectToSignInOptions): void {
  window.location.href = buildSignInUrl(config, options);
}

/**
 * Redirects the browser to the Falcon Auth sign-up page.
 * Must be called in a browser context (`window` must be available).
 */
export function redirectToSignUp(config: FalconAuthConfig, options: RedirectToSignInOptions): void {
  window.location.href = buildSignUpUrl(config, options);
}

export interface ExchangeCodeOptions {
  /** The authorization code received in the callback URL. */
  code: string;
}

export interface ExchangeCodeResult {
  /** The Better-Auth session token. Store this as a cookie to authenticate future requests. */
  sessionToken: string;
}

/**
 * Exchanges a short-lived authorization code for a session token.
 *
 * Call this in your app's auth callback route after receiving the `code` query
 * parameter. The Falcon auth server will set the per-app session cookie on its
 * own origin during this exchange. Afterward, use a Falcon auth client with
 * `credentials: "include"` to verify that the browser can read the session.
 *
 * @example
 * ```ts
 * await exchangeCodeForSession(config, { code });
 * const { data } = await falconAuthClient.getSession();
 * if (!data?.session) throw new Error("Session not visible after callback");
 * ```
 */
export async function exchangeCodeForSession(
  config: FalconAuthConfig,
  options: ExchangeCodeOptions,
): Promise<ExchangeCodeResult> {
  const url = `${config.serverUrl.replace(/\/$/, "")}/auth/token`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code: options.code, client_id: config.publishableKey }),
  });

  if (!response.ok) {
    let message = "Authorization code exchange failed";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return response.json() as Promise<ExchangeCodeResult>;
}
