export interface SessionLookupResult {
  data?: {
    user?: unknown;
    session?: unknown;
  } | null;
}

export interface CompleteAuthCallbackOptions {
  code?: string;
  state?: string;
  storedState?: string | null;
  exchangeCode: (code: string) => Promise<unknown>;
  getSession: () => Promise<SessionLookupResult>;
  wait?: (ms: number) => Promise<void>;
  maxSessionChecks?: number;
  retryDelayMs?: number;
}

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
