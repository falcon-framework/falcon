/**
 * Builds headers for browser or server `fetch` calls to Falcon Connect (`/v1/*`).
 * Sets **`X-Falcon-App-Id`** and **`X-Organization-Id`** (required by Connect).
 */
export function buildFalconConnectHeaders(options: {
  publishableKey: string;
  organizationId: string;
  init?: HeadersInit;
}): Headers {
  const id = options.organizationId?.trim();
  if (!id) {
    throw new Error("organizationId is required for X-Organization-Id");
  }
  const headers = new Headers(options.init);
  headers.set("X-Falcon-App-Id", options.publishableKey);
  headers.set("X-Organization-Id", id);
  return headers;
}
