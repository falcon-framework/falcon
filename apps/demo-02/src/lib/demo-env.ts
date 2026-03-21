function req(name: keyof ImportMetaEnv): string {
  const v = import.meta.env[name]
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Missing or invalid ${String(name)} in environment`)
  }
  return v.trim()
}

/** Validated Vite env for Falcon Auth + Connect (target app — demo-02). */
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
}

export const falconAuthConfig = {
  serverUrl: demoEnv.VITE_FALCON_AUTH_URL,
  publishableKey: demoEnv.VITE_FALCON_PUBLISHABLE_KEY,
} as const
