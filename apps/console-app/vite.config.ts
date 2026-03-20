import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { devtools } from "@tanstack/devtools-vite";

export default defineConfig({
  plugins: [devtools(), tsconfigPaths(), tailwindcss(), tanstackStart(), viteReact(), alchemy()],
  server: {
    port: 3002,
  },
});
