# Connect display helpers

The entry **`@falcon-framework/sdk/connect`** exposes **pure** helpers: they **do not** call HTTP. Your app (or a thin client wrapper) fetches **`GET /v1/apps`** and **`GET /v1/connections`** from Falcon Connect, then passes arrays into these functions to build labels and sorted display rows.

## Imports

```ts
import {
  buildFalconConnectAppMap,
  displayFalconConnection,
  falconConnectAppLabel,
  resolveFalconConnectionsDisplay,
  type FalconConnectAppMap,
  type FalconConnectConnectionDisplay,
} from "@falcon-framework/sdk/connect";
```

## Types

- **`FalconConnectAppDirectoryEntry`** — minimal app row: **`id`**, **`name`**, **`slug`** (matches **`GET /v1/apps`**).
- **`FalconConnectConnectionSummaryInput`** — minimal connection row: **`id`**, **`sourceAppId`**, **`targetAppId`**, **`status`**.

## `buildFalconConnectAppMap(apps)`

Builds a **`Map<appId, app>`** for O(1) lookups when labeling connections.

```ts
const apps = await fetchApps(); // your Connect client
const map = buildFalconConnectAppMap(apps);
```

## `falconConnectAppLabel(map, appId)`

Resolves a human-readable label: prefers **`name`**, then **`slug`**, then falls back to the raw **`appId`**.

```ts
const label = falconConnectAppLabel(map, connection.sourceAppId);
```

## `displayFalconConnection(connection, map)`

Returns a **`FalconConnectConnectionDisplay`** object:

| Field | Example |
| ----- | ------- |
| **`sourceLabel`** / **`targetLabel`** | Resolved via the app map |
| **`line`** | `"Orders App → CRM"` |
| **`status`** | Pass-through from the connection |

```ts
const row = displayFalconConnection(connection, map);
console.log(row.line); // "Source Name → Target Name"
```

## `resolveFalconConnectionsDisplay(listApps, listConnections)`

Convenience: **`Promise.all`** over your two list functions, builds the map, and maps each connection through **`displayFalconConnection`**.

```ts
const rows = await resolveFalconConnectionsDisplay(
  () => connectClient.apps.list(),
  () => connectClient.connections.list(),
);

return (
  <ul>
    {rows.map((r) => (
      <li key={r.id}>
        {r.line} — {r.status}
      </li>
    ))}
  </ul>
);
```

`listApps` and `listConnections` must return **read-only arrays** (or plain arrays) of the typed rows.

## Why it exists

Product screens often need a **single list model** for cards: connection id, status, readable source/target names, and optional deep links. Centralizing the join logic in the SDK avoids duplicating string formatting across apps and demos.

## Related topics

- [Falcon Connect concepts](../falcon-connect/concepts.md)
- [Managing connections](../falcon-connect/managing-connections.md)
