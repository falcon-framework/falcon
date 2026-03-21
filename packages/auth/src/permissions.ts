export function canCreateInstallationRequest(role: string): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canApproveInstallation(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canRevokeOrPauseConnection(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canCheckScope(role: string): boolean {
  return role === "owner" || role === "admin" || role === "member";
}
