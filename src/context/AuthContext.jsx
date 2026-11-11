// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStoredToken, setStoredToken, clearStoredToken } from "@/lib/authStorage";
import { decodeJwt, extractRole, extractDisplayName, isTokenExpired } from "@/lib/jwt";

const AuthContext = createContext(null);

/**
 * Normalize a raw backend user object into a predictable, flat, camelCase shape.
 * Handles:
 *   - Flat shape:        { Username, Email, FullName, CompanyId, ... }
 *   - Nested shape:      { Token, User: { Username, ... }, CompanyId }
 *   - camelCase/Pascal:  username | Username, fullName | FullName | FullNames, etc.
 *
 * Returns null if no usable user info could be derived.
 */
export function normalizeUser(userInfo, fallbackToken = null) {
  if (!userInfo) return null;

  // Unwrap nested `User` / `user` object if present
  const raw = userInfo.User || userInfo.user || userInfo.data || userInfo;

  const email = raw.email || raw.Email || null;
  const username =
    raw.username || raw.Username || raw.userName || raw.UserName || null;
  const memberNo =
    raw.memberNo || raw.MemberNo || raw.memberNumber || raw.MemberNumber || null;
  const fullName =
    raw.fullName ||
    raw.FullName ||
    raw.fullNames ||
    raw.FullNames ||
    raw.name ||
    raw.Name ||
    raw.displayName ||
    raw.DisplayName ||
    null;

  return {
    id: raw.id || raw.Id || raw.userId || raw.UserId || null,
    username: username || email || memberNo || null,
    email,
    fullName: fullName || username || email || null,
    memberNo,
    companyId:
      raw.companyId ||
      raw.CompanyId ||
      userInfo.companyId ||
      userInfo.CompanyId ||
      null,
    token: fallbackToken || userInfo.Token || userInfo.token || null,
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [userData, setUserData] = useState(() => {
    const storedUser = localStorage.getItem('userData');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);

  // ── login() — the fix lives here ──────────────────────────────────────
  const login = useCallback((newToken, userInfo = null) => {
    setStoredToken(newToken);
    setToken(newToken);

    if (userInfo) {
      // Preserve original raw data for any consumers that use `userData`
      setUserData(userInfo);
      localStorage.setItem('userData', JSON.stringify(userInfo));

      // ALSO persist a normalized, flat, camelCase copy under `rubaniUser`
      // so OnlineLoanApplications (and any other page that needs
      // `username` / `fullName`) can read it reliably.
      const normalized = normalizeUser(userInfo, newToken);
      if (normalized) {
        localStorage.setItem('rubaniUser', JSON.stringify(normalized));
      }
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUserData(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('rubaniUser'); // clean up the normalized copy too
  }, []);

  useEffect(() => {
    if (claims && isTokenExpired(claims)) {
      logout();
    }
  }, [claims, logout]);

  const role = extractRole(claims);

  const value = {
    token,
    claims,
    role,
    userData,
    companyId: userData?.CompanyId || userData?.companyId || null,
    displayName: extractDisplayName(claims),
    isAuthenticated: !!token && !isTokenExpired(claims),
    isAdmin: role === "Admin",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}