import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { STORAGE_KEYS, PASSWORD_RULES } from '../constants';
import type { User, Session, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

function hashPasswordSync(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  const positiveHash = Math.abs(hash);
  return positiveHash.toString(16).padStart(8, '0');
}

function computeHash(password: string): string {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // We need a synchronous approach for login/signup returning boolean.
    // Use a simple but deterministic hash since crypto.subtle is async.
    // For demo purposes, use a basic hash function.
  }
  // Simple deterministic hash for demo purposes
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < password.length; i++) {
    const ch = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(16, '0');
}

function validateUsername(username: string): string | null {
  if (!username || username.trim().length === 0) {
    return 'Username is required.';
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return 'Username must be at least 3 characters.';
  }
  if (trimmed.length > 32) {
    return 'Username must be at most 32 characters.';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return 'Username may only contain letters, numbers, and underscores.';
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (!PASSWORD_RULES.pattern.test(password)) {
    return PASSWORD_RULES.message;
  }
  return null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [users, setUsers] = useLocalStorage<User[]>(STORAGE_KEYS.users, []);
  const [session, setSession] = useLocalStorage<Session | null>(STORAGE_KEYS.session, null);

  const user = useMemo<User | null>(() => {
    if (!session) return null;
    const found = users.find((u) => u.username === session.username);
    return found || null;
  }, [session, users]);

  const isAuthenticated = useMemo(() => {
    return session !== null && user !== null;
  }, [session, user]);

  const login = useCallback(
    (username: string, password: string): boolean => {
      const usernameError = validateUsername(username);
      if (usernameError) {
        return false;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return false;
      }

      const trimmedUsername = username.trim().toLowerCase();
      const passwordHash = computeHash(password);

      const existingUser = users.find(
        (u) => u.username.toLowerCase() === trimmedUsername && u.passwordHash === passwordHash,
      );

      if (!existingUser) {
        return false;
      }

      const newSession: Session = {
        username: existingUser.username,
        token: uuidv4(),
        loginTime: Date.now(),
      };

      setSession(newSession);
      return true;
    },
    [users, setSession],
  );

  const signup = useCallback(
    (username: string, password: string): boolean => {
      const usernameError = validateUsername(username);
      if (usernameError) {
        return false;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return false;
      }

      const trimmedUsername = username.trim();
      const lowerUsername = trimmedUsername.toLowerCase();

      const existingUser = users.find((u) => u.username.toLowerCase() === lowerUsername);
      if (existingUser) {
        return false;
      }

      const passwordHash = computeHash(password);

      const newUser: User = {
        username: trimmedUsername,
        passwordHash,
      };

      setUsers((prev) => [...prev, newUser]);

      const newSession: Session = {
        username: trimmedUsername,
        token: uuidv4(),
        loginTime: Date.now(),
      };

      setSession(newSession);
      return true;
    },
    [users, setUsers, setSession],
  );

  const logout = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isAuthenticated,
      login,
      signup,
      logout,
    }),
    [user, session, isAuthenticated, login, signup, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
export default AuthProvider;