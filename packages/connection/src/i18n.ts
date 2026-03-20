export const germanMessages = {
  // Auth errors
  unauthorized: "Authentifizierung erforderlich. Bitte melden Sie sich an.",
  forbidden: "Zugriff verweigert. Sie haben keine Berechtigung für diese Aktion.",
  tenantMismatch: "Mandantenfehler. Die Ressource gehört nicht zu Ihrer Organisation.",

  // Resource errors
  appNotFound: (id: string) => `Anwendung mit ID '${id}' nicht gefunden.`,
  connectionNotFound: (id: string) => `Verbindung mit ID '${id}' nicht gefunden.`,
  installationRequestNotFound: (id: string) =>
    `Installationsanfrage mit ID '${id}' nicht gefunden.`,
  syncJobNotFound: (id: string) => `Synchronisierungsauftrag mit ID '${id}' nicht gefunden.`,

  // State errors
  installationRequestNotPending: "Die Installationsanfrage ist nicht im Status 'ausstehend'.",
  connectionNotActive: (status: string) =>
    `Die Verbindung ist nicht aktiv (aktueller Status: ${status}).`,
  duplicateConnection:
    "Eine aktive Verbindung zwischen diesen Anwendungen existiert bereits für Ihre Organisation.",

  // Scope errors
  scopeNotGranted: (scope: string) =>
    `Der Scope '${scope}' wurde für diese Verbindung nicht gewährt.`,

  // Database errors
  databaseError: "Ein interner Datenbankfehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
} as const;
