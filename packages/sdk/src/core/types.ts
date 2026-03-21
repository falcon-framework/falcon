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

export interface FalconSession {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface FalconAuthState {
  user: FalconUser | null;
  session: FalconSession | null;
  isLoaded: boolean;
  isSignedIn: boolean;
}
