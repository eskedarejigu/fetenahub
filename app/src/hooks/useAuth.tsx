import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { verifyAuth } from '@/lib/api';
import { useTelegram } from './useTelegram';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isReady, isInTelegram } = useTelegram();

  const refreshUser = useCallback(async () => {
    try {
      setError(null);
      const response = await verifyAuth();
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Wait for Telegram WebApp to be ready
    if (!isReady) return;

    const initAuth = async () => {
      setIsLoading(true);
      try {
        // For development without Telegram
        if (!isInTelegram && import.meta.env.DEV) {
          console.log('Not in Telegram - development mode');
          // You can set a mock user here for development
          // setUser(mockUser);
          setIsLoading(false);
          return;
        }

        await refreshUser();
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [isReady, isInTelegram, refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
