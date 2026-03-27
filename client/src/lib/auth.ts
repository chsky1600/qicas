export function getUserRole(): "admin" | "support" | null {
  const match = document.cookie
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith("token="));
  if (!match) return null;

  const token = match.split("=")[1];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getUserRole() === "admin";
}
