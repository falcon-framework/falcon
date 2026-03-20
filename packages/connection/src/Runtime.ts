import { HttpApiBuilder, HttpServer } from "@effect/platform";
import { Context, Layer } from "effect";
import { FalconConnectionApi } from "./Definition.js";
import { ApiHandlers } from "./Handlers.js";
import { germanMessages } from "./i18n.js";
import { PrincipalTag, resolvePrincipal } from "./principal.js";
import type { Principal } from "./principal.js";
import { ServicesLive } from "./services/index.js";

// Placeholder principal provided at layer build time.
// The real principal is injected per-request via the context parameter
// to `effectHandler`, which overwrites this value at request time.
const PrincipalPlaceholderLayer = Layer.succeed(PrincipalTag, {
  userId: "",
  organizationId: "",
  role: "",
  authMethod: "session" as Principal["authMethod"],
});

// Build the fully-satisfied handler layer:
// 1. ApiHandlers needs services + principal → provide them
// 2. HttpApiBuilder.api needs the ApiGroup → provide ApiHandlers
// 3. Merge with HttpServer.layerContext for platform services
const ApiHandlersLive = ApiHandlers.pipe(
  Layer.provide(ServicesLive),
  Layer.provide(PrincipalPlaceholderLayer),
);

const ApiLive = HttpApiBuilder.api(FalconConnectionApi).pipe(
  Layer.provide(ApiHandlersLive),
);

const AppLayer = Layer.merge(ApiLive, HttpServer.layerContext);

export function makeConnectionWebHandler(betterAuthUrl: string): {
  handler: (request: Request) => Promise<Response>;
  dispose: () => Promise<void>;
} {
  const { handler: effectHandler, dispose } =
    HttpApiBuilder.toWebHandler(AppLayer);

  const handler = async (request: Request): Promise<Response> => {
    const principal = await resolvePrincipal(request.headers, betterAuthUrl);

    if (!principal) {
      return Response.json(
        { error: germanMessages.unauthorized },
        { status: 401 },
      );
    }

    const principalContext = Context.make(
      PrincipalTag,
      principal,
    ) as unknown as Context.Context<never>;

    return effectHandler(request, principalContext);
  };

  return { handler, dispose };
}
