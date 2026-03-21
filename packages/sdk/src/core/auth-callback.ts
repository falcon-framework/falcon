/**
 * Shape returned by {@link completeAuthCallback}'s `getSession` hook.
 * Matches the common `{ data: sessionPayload }` pattern (e.g. wrapping {@link fetchFalconSession}).
 */
export interface SessionLookupResult {
  data?: {
    user?: unknown;
    session?: unknown;
  } | null;
}

export interface CompleteAuthCallbackOptions {
  /** Authorization `code` query parameter from the redirect back to your app. */
  code?: string;
  /** `state` query parameter returned by the auth server (if you sent one at authorize time). */
  state?: string;
  /**
   * Value previously stored (e.g. in `sessionStorage`) when starting sign-in.
   * Must match `state` when both are set.
   */
  storedState?: string | null;
  /** Exchange the code for a session (typically {@link import("./redirect").exchangeCodeForSession}). */
  exchangeCode: (code: string) => Promise<unknown>;
  /**
   * Read the current session from the app’s perspective after exchange.
   * Should return `{ data: await fetchFalconSession(config) }` or your auth client’s `getSession()` shape.
   * Use {@link import("./session").fetchFalconSession} for the raw Falcon Auth session read.
   */
  getSession: () => Promise<SessionLookupResult>;
  /** Override for tests or non-browser environments (default: `setTimeout` promise). */
  wait?: (ms: number) => Promise<void>;
  /** How many times to poll for a visible session after a successful exchange (default: 3). */
  maxSessionChecks?: number;
  /** Delay between session polls in ms (default: 100). */
  retryDelayMs?: number;
}

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Completes the OAuth-style callback after the user returns from the Falcon Auth server.
 *
 * 1. Requires `code` and validates `state` against `storedState` when a state was used at authorize time.
 * 2. Calls `exchangeCode` (usually {@link import("./redirect").exchangeCodeForSession}).
 * 3. Polls `getSession` a few times so navigation can proceed once the browser session is visible to your app.
 *
 * @throws If `code` is missing, state does not match, exchange fails, or the session never becomes visible.
 */
export async function completeAuthCallback({
  code,
  state,
  storedState,
  exchangeCode,
  getSession,
  wait = defaultWait,
  maxSessionChecks = 3,
  retryDelayMs = 100,
}: CompleteAuthCallbackOptions): Promise<void> {
  if (!code) {
    throw new Error("Missing authorization code in callback URL.");
  }

  if (state && storedState !== state) {
    throw new Error("State mismatch — possible CSRF attempt. Please try signing in again.");
  }

  await exchangeCode(code);

  for (let attempt = 0; attempt < maxSessionChecks; attempt += 1) {
    const { data } = await getSession();
    if (data?.user && data.session) {
      return;
    }

    if (attempt < maxSessionChecks - 1) {
      await wait(retryDelayMs);
    }
  }

  throw new Error(
    "Sign-in completed, but the session is still not available in this app. Please try again.",
  );
}
