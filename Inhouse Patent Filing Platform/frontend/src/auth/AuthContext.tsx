import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AUTH_EXPIRED_EVENT,
  ROLE_KEY,
  TOKEN_KEY,
  USER_KEY,
} from "../services/api";
import type { Role } from "../types";

export interface AuthUser {
  id?: string;
  name?: string;
  email?: string;
  role: Role;
  department?: string;
}

/** Legacy "IPForge" storage keys, still read for sessions created before the
 *  keys were unified. They are removed on the next login/logout. */
const LEGACY_TOKEN_KEY = "ipforge-token";
const LEGACY_USER_KEY = "ipforge-user";
const LEGACY_ROLE_KEY = "ipforge-role";

const VALID_ROLES: Role[] = ["APPLICANT", "FACULTY", "ADMIN"];

function readStoredUser(): AuthUser | null {
  try {
    const raw =
      localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
    const token =
      localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);

    if (!raw || !token) return null;

    const user = JSON.parse(raw);
    if (user && VALID_ROLES.includes(user.role)) {
      return user as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  [
    TOKEN_KEY,
    USER_KEY,
    ROLE_KEY,
    LEGACY_TOKEN_KEY,
    LEGACY_USER_KEY,
    LEGACY_ROLE_KEY,
  ].forEach((key) => localStorage.removeItem(key));
}

interface AuthContextValue {
  user: AuthUser | null;
  /** Persist a session returned by /auth/login, /auth/register or /auth/admin-login. */
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);

  const login = useCallback((token: string, nextUser: AuthUser) => {
    // Write the canonical keys only, so a stale legacy token can never
    // shadow the new one.
    clearStoredSession();
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    localStorage.setItem(ROLE_KEY, nextUser.role);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
  }, []);

  useEffect(() => {
    // Session cleared by the API layer (HTTP 401) …
    const onExpired = () => setUser(null);
    // … or changed in another tab.
    const onStorage = () => setUser(readStoredUser());

    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
