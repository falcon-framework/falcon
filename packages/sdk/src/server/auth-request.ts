import { sessionCookieName } from "../core/cookie";

export type HeaderBag = Headers | Record<string, string | string[] | undefined>;

export type IncomingServerRequest = Request | { headers: HeaderBag };

export interface FalconServerAuthInput {
  incomingRequest?: IncomingServerRequest;
  sessionToken?: string;
}

function cookieFromHeaderBag(headers: HeaderBag): string | undefined {
  if (headers instanceof Headers) {
    return headers.get("cookie") ?? undefined;
  }

  const raw = headers["cookie"];
  return Array.isArray(raw) ? raw.join("; ") : (raw ?? undefined);
}

export function resolveCookieHeader(
  publishableKey: string,
  input: IncomingServerRequest | FalconServerAuthInput,
): string | undefined {
  if (input instanceof Request) {
    return input.headers.get("cookie") ?? undefined;
  }

  if ("headers" in input) {
    return cookieFromHeaderBag(input.headers);
  }

  const token = input.sessionToken?.trim();
  if (token) {
    return `${sessionCookieName(publishableKey)}=${token}`;
  }

  const request = input.incomingRequest;
  if (!request) {
    return undefined;
  }

  if (request instanceof Request) {
    return request.headers.get("cookie") ?? undefined;
  }

  return cookieFromHeaderBag(request.headers);
}
