function req(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name]
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Missing or invalid ${String(name)} in environment`)
  }
  return v.trim()
}

/** Validated Vite env for Falcon Auth + Connect (source app — demo-01). */
export const demoEnv = {
  get VITE_FALCON_AUTH_URL() {
    return req('VITE_FALCON_AUTH_URL')
  },
  get VITE_FALCON_PUBLISHABLE_KEY() {
    return req('VITE_FALCON_PUBLISHABLE_KEY')
  },
  get VITE_CONNECT_URL() {
    return req('VITE_CONNECT_URL').replace(/\/$/, '')
  },
  get VITE_FALCON_APP_ID() {
    return req('VITE_FALCON_APP_ID')
  },
  get VITE_PEER_APP_ID() {
    return req('VITE_PEER_APP_ID')
  },
  get VITE_PEER_APP_ORIGIN() {
    return req('VITE_PEER_APP_ORIGIN').replace(/\/$/, '')
  },
  /** This demo’s public origin (links to “open this app” from connection rows). */
  get VITE_APP_PUBLIC_ORIGIN() {
    return req('VITE_APP_PUBLIC_ORIGIN').replace(/\/$/, '')
  },
  /** Falcon console (account, orgs, connections UI). */
  get VITE_FALCON_CONSOLE_URL() {
    return req('VITE_FALCON_CONSOLE_URL').replace(/\/$/, '')
  },
}

export const falconAuthConfig = {
  serverUrl: demoEnv.VITE_FALCON_AUTH_URL,
  publishableKey: demoEnv.VITE_FALCON_PUBLISHABLE_KEY,
} as const
