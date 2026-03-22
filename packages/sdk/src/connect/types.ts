import type { FalconConnectApp, FalconConnectConnection } from "./schemas";

/** Minimal app fields from `GET /v1/apps` used for display labels. */
export type FalconConnectAppDirectoryEntry = Pick<FalconConnectApp, "id" | "name" | "slug">;

/** Minimal connection fields from `GET /v1/connections` for labeling. */
export type FalconConnectConnectionSummaryInput = Pick<
  FalconConnectConnection,
  "id" | "sourceAppId" | "targetAppId" | "status"
>;
