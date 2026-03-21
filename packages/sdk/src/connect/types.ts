/** Minimal app fields from `GET /v1/apps` used for display labels. */
export interface FalconConnectAppDirectoryEntry {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

/** Minimal connection fields from `GET /v1/connections` for labeling. */
export interface FalconConnectConnectionSummaryInput {
  readonly id: string;
  readonly sourceAppId: string;
  readonly targetAppId: string;
  readonly status: string;
}
