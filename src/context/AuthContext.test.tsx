import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../constants';

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  };
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('useAuth hook', () => {
    it('throws when used outside AuthProvider', () => {
      const consoleError = console.error;
      console.error = () => {};
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      console.error = consoleError;
    });
  });

  describe('initial state', () => {
    it('starts with no user and not authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signup', () => {
    it('creates a new user with valid credentials', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('TestUser', 'Password1');
      });

      expect(success!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.user!.username).toBe('TestUser');
      expect(result.current.session).not.toBeNull();
      expect(result.current.session!.username).toBe('TestUser');
    });

    it('persists user to localStorage', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('Alice', 'Password1');
      });

      const raw = localStorage.getItem(STORAGE_KEYS.users);
      expect(raw).not.toBeNull();
      const users = JSON.parse(raw!);
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('Alice');
      expect(users[0].passwordHash).toBeDefined();
    });

    it('persists session to localStorage', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('Alice', 'Password1');
      });

      const raw = localStorage.getItem(STORAGE_KEYS.session);
      expect(raw).not.toBeNull();
      const session = JSON.parse(raw!);
      expect(session.username).toBe('Alice');
      expect(session.token).toBeDefined();
      expect(session.loginTime).toBeDefined();
    });

    it('prevents duplicate username signup', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('Alice', 'Password1');
      });

      // Logout first so we can try signing up again
      act(() => {
        result.current.logout();
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('Alice', 'DifferentPass1');
      });

      expect(success!).toBe(false);
    });

    it('prevents duplicate username signup case-insensitively', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('Alice', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('alice', 'Password1');
      });

      expect(success!).toBe(false);
    });

    it('rejects signup with empty username', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('', 'Password1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects signup with short username', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('ab', 'Password1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects signup with invalid password missing uppercase', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('TestUser', 'password1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects signup with invalid password missing number', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('TestUser', 'Password');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects signup with too short password', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.signup('TestUser', 'Pass1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('logs in with valid credentials', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);

      let success: boolean;
      act(() => {
        success = result.current.login('TestUser', 'Password1');
      });

      expect(success!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).not.toBeNull();
      expect(result.current.user!.username).toBe('TestUser');
    });

    it('rejects login with wrong password', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      let success: boolean;
      act(() => {
        success = result.current.login('TestUser', 'WrongPass1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects login with non-existent username', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.login('NonExistent', 'Password1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects login with empty username', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      let success: boolean;
      act(() => {
        success = result.current.login('', 'Password1');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('rejects login with invalid password format', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      let success: boolean;
      act(() => {
        success = result.current.login('TestUser', 'short');
      });

      expect(success!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles case-insensitive username login', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      let success: boolean;
      act(() => {
        success = result.current.login('testuser', 'Password1');
      });

      expect(success!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('logout', () => {
    it('clears session on logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
    });

    it('clears session from localStorage on logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      const raw = localStorage.getItem(STORAGE_KEYS.session);
      const session = raw ? JSON.parse(raw) : null;
      expect(session).toBeNull();
    });

    it('preserves users in localStorage after logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('TestUser', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      const raw = localStorage.getItem(STORAGE_KEYS.users);
      expect(raw).not.toBeNull();
      const users = JSON.parse(raw!);
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('TestUser');
    });
  });

  describe('session persistence', () => {
    it('restores session from localStorage on mount', () => {
      // First, create a user and session
      const { result: firstResult } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        firstResult.current.signup('PersistUser', 'Password1');
      });

      expect(firstResult.current.isAuthenticated).toBe(true);

      // Mount a new hook instance with a fresh wrapper (simulates page reload)
      const { result: secondResult } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(secondResult.current.isAuthenticated).toBe(true);
      expect(secondResult.current.user).not.toBeNull();
      expect(secondResult.current.user!.username).toBe('PersistUser');
      expect(secondResult.current.session).not.toBeNull();
      expect(secondResult.current.session!.username).toBe('PersistUser');
    });

    it('does not restore session if localStorage session is cleared', () => {
      const { result: firstResult } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        firstResult.current.signup('PersistUser', 'Password1');
      });

      // Manually clear session from localStorage
      localStorage.removeItem(STORAGE_KEYS.session);

      const { result: secondResult } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(secondResult.current.isAuthenticated).toBe(false);
      expect(secondResult.current.user).toBeNull();
      expect(secondResult.current.session).toBeNull();
    });
  });

  describe('multiple users', () => {
    it('supports multiple user signups', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('UserOne', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.signup('UserTwo', 'Password2');
      });

      const raw = localStorage.getItem(STORAGE_KEYS.users);
      const users = JSON.parse(raw!);
      expect(users).toHaveLength(2);

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user!.username).toBe('UserTwo');
    });

    it('allows different users to log in after signup', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.signup('UserOne', 'Password1');
      });

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.signup('UserTwo', 'Password2');
      });

      act(() => {
        result.current.logout();
      });

      let success: boolean;
      act(() => {
        success = result.current.login('UserOne', 'Password1');
      });

      expect(success!).toBe(true);
      expect(result.current.user!.username).toBe('UserOne');

      act(() => {
        result.current.logout();
      });

      act(() => {
        success = result.current.login('UserTwo', 'Password2');
      });

      expect(success!).toBe(true);
      expect(result.current.user!.username).toBe('UserTwo');
    });
  });
});