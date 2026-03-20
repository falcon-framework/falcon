import { closeDb, makeDb } from "@falcon-framework/db";
import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Context, Layer } from "effect";
import { FalconConnectionApi } from "./Definition.js";
import { ApiHandlers } from "./Handlers.js";
import { germanMessages } from "./i18n.js";
import { PrincipalTag, resolvePrincipalWithRetry } from "./principal.js";
import type { Principal } from "./principal.js";
import { makeServicesLive } from "./services/index.js";

// Placeholder principal provided at layer build time.
// The real principal is injected per-request via the context parameter
// to `effectHandler`, which overwrites this value at request time.
const PrincipalPlaceholderLayer = Layer.succeed(PrincipalTag, {
  userId: "",
  organizationId: "",
  role: "",
  authMethod: "session" as Principal["authMethod"],
});

export function makeConnectionWebHandler(betterAuthUrl: string): {
  handler: (request: Request) => Promise<Response>;
  dispose: () => Promise<void>;
} {
  const handler = async (request: Request): Promise<Response> => {
    // One postgres client per Worker fetch — membership lookup + handlers must share it.
    // A module singleton `db` in principal resolution caused cross-request TCP/promise warnings.
    const db = makeDb();
    let disposeEffect: (() => Promise<void>) | undefined;
    try {
      const principal = await resolvePrincipalWithRetry(request.headers, betterAuthUrl, db);

      if (!principal) {
        return Response.json({ error: germanMessages.unauthorized }, { status: 401 });
      }

      const principalContext = Context.make(
        PrincipalTag,
        principal,
      ) as unknown as Context.Context<never>;

      const ApiHandlersLive = ApiHandlers.pipe(
        Layer.provide(makeServicesLive(db)),
        Layer.provide(PrincipalPlaceholderLayer),
      );
      const ApiLive = HttpApiBuilder.api(FalconConnectionApi).pipe(Layer.provide(ApiHandlersLive));
      const AppLayer = Layer.merge(ApiLive, HttpServer.layerContext);
      const { handler: effectHandler, dispose } = HttpApiBuilder.toWebHandler(AppLayer);
      disposeEffect = dispose;

      return await effectHandler(request, principalContext);
    } finally {
      if (disposeEffect) await disposeEffect();
      await closeDb(db);
    }
  };

  return {
    handler,
    dispose: async () => {
      /* per-request dispose in handler; nothing global to tear down */
    },
  };
}
