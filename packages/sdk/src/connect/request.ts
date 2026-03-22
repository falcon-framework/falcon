import { buildFalconConnectHeaders } from "../core/connect-headers";
import {
  FalconConnectHttpError,
  FalconConnectNetworkError,
  FalconConnectParseError,
  FalconConnectValidationError,
  messageFromApiErrorBody,
} from "./error";
import type { z } from "zod";

export interface ConnectFetchContext {
  readonly baseUrl: string;
  readonly organizationId: string;
  readonly publishableKey?: string;
  readonly credentials: RequestCredentials;
  readonly fetchFn: typeof fetch;
  readonly getHeaders?: () => HeadersInit | Promise<HeadersInit>;
  readonly getAccessToken?: () => string | undefined | Promise<string | undefined>;
}

function joinBaseAndPath(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}/v1${p}`;
}

async function buildRequestHeaders(ctx: ConnectFetchContext, init?: RequestInit): Promise<Headers> {
  const headers = new Headers(ctx.getHeaders ? await ctx.getHeaders() : undefined);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  }

  if (ctx.publishableKey?.trim()) {
    const merged = buildFalconConnectHeaders({
      publishableKey: ctx.publishableKey.trim(),
      organizationId: ctx.organizationId,
      init: headers,
    });
    merged.forEach((value, key) => headers.set(key, value));
  } else {
    headers.set("X-Organization-Id", ctx.organizationId);
  }

  headers.set("Content-Type", "application/json");

  const token = ctx.getAccessToken ? await ctx.getAccessToken() : undefined;
  if (token?.trim()) {
    headers.set("Authorization", `Bearer ${token.trim()}`);
  }

  return headers;
}

export async function connectFetchJson<T>(
  ctx: ConnectFetchContext,
  path: string,
  init: RequestInit = {},
  schema: z.ZodType<T>,
): Promise<T> {
  const url = joinBaseAndPath(ctx.baseUrl, path);
  const method = (init.method ?? "GET").toUpperCase();
  let headers: Headers;
  try {
    headers = await buildRequestHeaders(ctx, init);
  } catch (e) {
    throw new FalconConnectNetworkError("Failed to build Connect request headers", { cause: e });
  }

  let res: Response;
  try {
    res = await ctx.fetchFn(url, {
      ...init,
      method,
      headers,
      credentials: ctx.credentials,
    });
  } catch (e) {
    throw new FalconConnectNetworkError("Falcon Connect fetch failed", { cause: e });
  }

  const rawText = await res.text();
  const parseJson = (): unknown => {
    if (!rawText.trim()) return undefined;
    try {
      return JSON.parse(rawText) as unknown;
    } catch {
      return undefined;
    }
  };

  if (!res.ok) {
    let body: unknown = parseJson();
    if (body === undefined && rawText.trim()) {
      body = { message: rawText };
    }
    const msg =
      messageFromApiErrorBody(body) ?? res.statusText ?? `HTTP ${res.status}`;
    throw new FalconConnectHttpError(res.status, msg, body);
  }

  const data = parseJson();
  if (data === undefined && !rawText.trim()) {
    throw new FalconConnectParseError("Empty response body", { method, path });
  }
  if (data === undefined && rawText.trim()) {
    throw new FalconConnectParseError("Response was not valid JSON", { method, path });
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new FalconConnectValidationError(
      "Falcon Connect response failed validation",
      parsed.error,
      { method, path, rawBody: rawText.slice(0, 8_000) },
    );
  }
  return parsed.data;
}
