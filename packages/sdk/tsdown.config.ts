import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    react: "src/react.ts",
    server: "src/server.ts",
    connect: "src/connect.ts",
  },
  format: "esm",
  platform: "neutral",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: {
    neverBundle: ["react", "react-dom", "better-auth", "zod", /^better-auth\//],
  },
});
