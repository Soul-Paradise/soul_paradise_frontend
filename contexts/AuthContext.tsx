/**
 * Authentication Context Provider
 * Manages global authentication state following SOLID principles
 * - Single Responsibility: Only handles authentication state
 * - Open/Closed: Extensible without modification
 * - Dependency Inversion: Depends on abstractions (api interface)
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, type User, type LoginRequest, type RegisterRequest, type ApiError } from '@/lib/api';

// Authentication State Interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Authentication Actions Interface (Interface Segregation Principle)
interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  googleAuth: (idToken: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

// Combined Context Type
interface AuthContextType extends AuthState, AuthActions {}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider Component
 * Provides authentication state and actions to the entire app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State Management
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isAuthenticated = useMemo(() => !!user, [user]);

  /**
   * Check if user is authenticated on mount
   * Follows DRY principle - centralized auth check
   */
  const checkAuth = useCallback(async () => {
    try {
      if (!api.isAuthenticated()) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Auth check failed:', err);
      // Clear invalid tokens
      api.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login Handler
   * Implements error handling and navigation
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setError(null);
        setIsLoading(true);

        const response = await api.login(credentials);
        setUser(response.user as User);

        // Smooth redirect to home
        router.push('/');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Login failed. Please try again.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Google OAuth Handler
   * Implements error handling and navigation for Google login
   */
  const googleAuth = useCallback(
    async (idToken: string) => {
      try {
        setError(null);
        setIsLoading(true);

        const response = await api.googleAuth(idToken);
        setUser(response.user as User);

        // Smooth redirect to home
        router.push('/');
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Google authentication failed. Please try again.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Register Handler
   * Implements error handling and navigation
   * Redirects to login page with verification message after successful registration
   */
  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        setError(null);
        setIsLoading(true);

        await api.register(data);
        // Don't set user in state - they need to verify email first

        // Redirect to login page with verification message
        router.push(`/login?registered=true&email=${encodeURIComponent(data.email)}`);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Registration failed. Please try again.');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  /**
   * Logout Handler
   * Cleans up state and redirects
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      api.clearTokens();
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  /**
   * Clear Error Handler
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initial auth check on mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Auto-redirect authenticated users from auth pages
   * Provides smooth SPA experience
   */
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const authPages = ['/login', '/register', '/forgot-password'];
      if (authPages.includes(pathname)) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // Memoized context value to prevent unnecessary re-renders (Performance optimization)
  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      googleAuth,
      register,
      logout,
      clearError,
      checkAuth,
    }),
    [user, isAuthenticated, isLoading, error, login, googleAuth, register, logout, clearError, checkAuth]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Custom Hook to use Auth Context
 * Implements error handling for context usage
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

/**
 * Helper hook for protected routes
 * Returns loading state while checking auth
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}
