export function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const ROLE_CLAIM_KEYS = [
  "role",
  "Role",
  "roles",
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
];

export function extractRole(decoded) {
  if (!decoded) return null;
  for (const key of ROLE_CLAIM_KEYS) {
    const value = decoded[key];
    if (Array.isArray(value)) return value[0];
    if (value) return value;
  }
  return null;
}

const NAME_CLAIM_KEYS = [
  "unique_name",
  "name",
  "given_name",
  "username",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  "sub",
  "email",
];

export function extractDisplayName(decoded) {
  if (!decoded) return "User";
  for (const key of NAME_CLAIM_KEYS) {
    if (decoded[key]) return decoded[key];
  }
  return "User";
}

export function isTokenExpired(decoded) {
  if (!decoded?.exp) return false;
  return Date.now() >= decoded.exp * 1000;
}
