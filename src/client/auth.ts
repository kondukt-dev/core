import type { AuthConfig } from "./types.js";

export function buildAuthHeaders(auth: AuthConfig | undefined): Record<string, string> {
  if (!auth || auth.type === "none") return {};
  if (auth.type === "bearer") return { Authorization: `Bearer ${auth.token}` };
  if (auth.type === "api-key") return { [auth.headerName]: auth.value };
  if (auth.type === "custom") return { ...auth.headers };
  const _exhaustive: never = auth;
  return _exhaustive;
}
