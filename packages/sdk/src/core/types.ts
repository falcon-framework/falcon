export interface FalconAuthConfig {
  /** The URL of the Falcon auth server, e.g. "https://auth.example.com" */
  serverUrl: string;
  /** The publishable key for your app (starts with "pk_") */
  publishableKey: string;
}

export interface FalconUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization row shape from Better Auth’s organization plugin (session payloads and list endpoints).
 * Dates may be ISO strings over the wire.
 */
export interface FalconOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  metadata?: string | null;
  createdAt: Date | string;
}

export interface FalconSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  /** Set when the organization plugin is enabled and an active org is selected. */
  activeOrganizationId?: string | null;
}

export interface FalconAuthState {
  user: FalconUser | null;
  session: FalconSession | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}

/** Full payload from `GET /api/auth/get-session` when signed in (includes optional org plugin fields). */
export interface FalconSessionResponse {
  user: FalconUser;
  session: FalconSession;
  /** Expanded active organization when the server includes it on the session response. */
  activeOrganization?: FalconOrganizationSummary | null;
  /** Optional list of organizations the user belongs to (when returned by the auth server). */
  organizations?: FalconOrganizationSummary[];
}
