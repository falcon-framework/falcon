import { Context, Effect, Layer } from "effect";
import {
  AppRepository,
  type AppRow,
  CapabilityRepository,
  type CapabilityRow,
} from "../repositories/index.js";
import type { DatabaseError } from "../errors.js";

export interface AppServiceService {
  listApps(): Effect.Effect<AppRow[], DatabaseError>;
  getCapabilities(
    appId: string,
  ): Effect.Effect<CapabilityRow[], DatabaseError>;
}

export class AppService extends Context.Tag(
  "@falcon-framework/connection/AppService",
)<AppService, AppServiceService>() {}

export const AppServiceLive = Layer.effect(
  AppService,
  Effect.gen(function* () {
    const appRepo = yield* AppRepository;
    const capRepo = yield* CapabilityRepository;
    return {
      listApps: () => appRepo.listActive(),
      getCapabilities: (appId: string) => capRepo.listByAppId(appId),
    };
  }),
);
