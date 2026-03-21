import type { FalconConnectAppDirectoryEntry, FalconConnectConnectionSummaryInput } from "./types";

export type FalconConnectAppMap = ReadonlyMap<string, FalconConnectAppDirectoryEntry>;

export function buildFalconConnectAppMap(
  apps: readonly FalconConnectAppDirectoryEntry[],
): FalconConnectAppMap {
  return new Map(apps.map((a) => [a.id, a] as const));
}

/** Resolved label for an app id using the directory from `GET /v1/apps`. */
export function falconConnectAppLabel(map: FalconConnectAppMap, appId: string): string {
  const a = map.get(appId);
  if (a?.name?.trim()) return a.name.trim();
  if (a?.slug?.trim()) return a.slug.trim();
  return appId;
}

export interface FalconConnectConnectionDisplay {
  readonly id: string;
  readonly sourceAppId: string;
  readonly targetAppId: string;
  readonly status: string;
  readonly sourceLabel: string;
  readonly targetLabel: string;
  /** e.g. `Orders App → CRM` */
  readonly line: string;
}

export function displayFalconConnection(
  connection: FalconConnectConnectionSummaryInput,
  map: FalconConnectAppMap,
): FalconConnectConnectionDisplay {
  const sourceLabel = falconConnectAppLabel(map, connection.sourceAppId);
  const targetLabel = falconConnectAppLabel(map, connection.targetAppId);
  return {
    id: connection.id,
    sourceAppId: connection.sourceAppId,
    targetAppId: connection.targetAppId,
    status: connection.status,
    sourceLabel,
    targetLabel,
    line: `${sourceLabel} → ${targetLabel}`,
  };
}

/**
 * Loads apps and connections from Falcon Connect and joins ids to human-readable names.
 * Pass your client's `list` methods (same shape as the REST API).
 */
export async function resolveFalconConnectionsDisplay<
  TApp extends FalconConnectAppDirectoryEntry,
  TConn extends FalconConnectConnectionSummaryInput,
>(listApps: () => Promise<readonly TApp[]>, listConnections: () => Promise<readonly TConn[]>) {
  const [apps, connections] = await Promise.all([listApps(), listConnections()]);
  const map = buildFalconConnectAppMap(apps);
  return connections.map((c) => displayFalconConnection(c, map));
}
