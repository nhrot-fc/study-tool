import React, { useState, useEffect } from 'react';
import type { User } from './types';
import { apiClient } from './api';
import { AuthContext } from '../context/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('access_token'));

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      try {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } catch {
        localStorage.removeItem('access_token');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await apiClient.login({ email, password });
    localStorage.setItem('refresh_token', tokens.refresh_token);
    const currentUser = await apiClient.getCurrentUser();
    setUser(currentUser);
  };

  const register = async (email: string, username: string, password: string) => {
    await apiClient.register({ email, username, password });
    // Auto-login after registration
    await login(email, password);
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

