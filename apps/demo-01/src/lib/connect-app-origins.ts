import { demoEnv } from "#/lib/demo-env";

/** Map a Connect `falcon_app.id` to the demo’s public URL (this app + known peer only). */
export function connectAppPublicOrigin(appId: string): string | undefined {
  if (appId === demoEnv.VITE_FALCON_APP_ID) return demoEnv.VITE_APP_PUBLIC_ORIGIN;
  if (appId === demoEnv.VITE_PEER_APP_ID) return demoEnv.VITE_PEER_APP_ORIGIN;
  return undefined;
}
