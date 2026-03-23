import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
import { Worker } from "alchemy/cloudflare";
import { config } from "dotenv";

// Load the root .env file as well for managing cross-service env vars
config({ path: "../../.env" });
config({ path: "./.env" });
config({ path: "../../apps/console-app/.env" });
config({ path: "../../apps/auth-server/.env" });
config({ path: "../../apps/connect-service/.env" });

const app = await alchemy("falcon");
const connectAccessTokenTtlSeconds = alchemy.secret.env.CONNECT_ACCESS_TOKEN_TTL_SECONDS ?? "300";

export const consoleApp = await TanStackStart("console-app", {
  cwd: "../../apps/console-app",
  dev: { command: "bun run dev:bare" },
  bindings: {
    VITE_SERVER_URL: alchemy.env.VITE_SERVER_URL!,
    DATABASE_URL: alchemy.secret.env.DATABASE_URL!,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    CONNECT_ACCESS_TOKEN_TTL_SECONDS: connectAccessTokenTtlSeconds,
    CONNECT_JWT_PRIVATE_KEY: alchemy.secret.env.CONNECT_JWT_PRIVATE_KEY!,
    CONNECT_JWT_PUBLIC_KEY: alchemy.env.CONNECT_JWT_PUBLIC_KEY!,
  },
});

export const authServer = await Worker("auth-server", {
  cwd: "../../apps/auth-server",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DATABASE_URL: alchemy.secret.env.DATABASE_URL!,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    CONNECT_ACCESS_TOKEN_TTL_SECONDS: connectAccessTokenTtlSeconds,
    CONNECT_JWT_PRIVATE_KEY: alchemy.secret.env.CONNECT_JWT_PRIVATE_KEY!,
    CONNECT_JWT_PUBLIC_KEY: alchemy.env.CONNECT_JWT_PUBLIC_KEY!,
  },
  dev: {
    port: 3000,
  },
});

export const connectService = await Worker("connect-service", {
  cwd: "../../apps/connect-service",
  entrypoint: "src/index.ts",
  compatibility: "node",
  bindings: {
    DATABASE_URL: alchemy.secret.env.DATABASE_URL!,
    CORS_ORIGIN: alchemy.env.CORS_ORIGIN!,
    BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL!,
    CONNECT_ACCESS_TOKEN_TTL_SECONDS: connectAccessTokenTtlSeconds,
    CONNECT_JWT_PRIVATE_KEY: alchemy.secret.env.CONNECT_JWT_PRIVATE_KEY!,
    CONNECT_JWT_PUBLIC_KEY: alchemy.env.CONNECT_JWT_PUBLIC_KEY!,
  },
  dev: {
    port: 3001,
  },
});

console.log(`Console App      -> ${consoleApp.url}`);
console.log(`Auth Server      -> ${authServer.url}`);
console.log(`Connect Service  -> ${connectService.url}`);

await app.finalize();
