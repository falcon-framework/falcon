/**
 * Returns the browser cookie name used to store the session token for a given
 * Falcon publishable key. Mirrors the naming used by the auth server.
 */
export function sessionCookieName(publishableKey: string): string {
  const safe = publishableKey.replace(/[^a-zA-Z0-9]/g, "_");
  return `falcon_${safe}.session_token`;
}
