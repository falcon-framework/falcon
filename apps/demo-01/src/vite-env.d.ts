/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FALCON_AUTH_URL: string
  readonly VITE_FALCON_PUBLISHABLE_KEY: string
  readonly VITE_CONNECT_URL: string
  readonly VITE_FALCON_APP_ID: string
  readonly VITE_PEER_APP_ID: string
  readonly VITE_PEER_APP_ORIGIN: string
  readonly VITE_APP_PUBLIC_ORIGIN: string
  readonly VITE_FALCON_CONSOLE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
