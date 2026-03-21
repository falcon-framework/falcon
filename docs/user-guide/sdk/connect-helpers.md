# Connect display helpers

The entry **`@falcon-framework/sdk/connect`** exposes small **pure helpers** for turning raw Connect API responses into display-friendly structures (labels, sorted lists). They do **not** call HTTP themselves.

## Typical use

1. Your UI fetches **`/v1/apps`** and **`/v1/connections`** with credentials and `X-Organization-Id`.
2. You pass those results into helpers such as **`resolveFalconConnectionsDisplay`** to align connection rows with app names from the directory.

## Why it exists

Product screens often need a **single list model** for rendering cards: connection id, status, human-readable source/target names, and deep links. Keeping that mapping in the SDK reduces duplication between demos, console code paths, and customer apps.

## Related topics

- [Falcon Connect concepts](../falcon-connect/concepts.md)
- [Managing connections](../falcon-connect/managing-connections.md)
