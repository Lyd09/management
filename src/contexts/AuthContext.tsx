
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  isLoggedIn: boolean;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loadingAuth: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'fastfilms_auth_status';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedAuthStatus = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuthStatus === 'true') {
      setIsLoggedIn(true);
    }
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (!loadingAuth) {
      if (!isLoggedIn && pathname !== '/login') {
        router.push('/login');
      } else if (isLoggedIn && pathname === '/login') {
        router.push('/');
      }
    }
  }, [isLoggedIn, loadingAuth, pathname, router]);

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    if (user === 'ff.admin' && pass === 'fastfilms') {
      setIsLoggedIn(true);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      router.push('/');
      return true;
    }
    return false;
  }, [router]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.push('/login');
  }, [router]);

  const contextValue = {
    isLoggedIn,
    login,
    logout,
    loadingAuth,
  };

  if (loadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      { (isLoggedIn && pathname !== '/login') || pathname === '/login' ? children : null }
    </AuthContext.Provider>
  );
};
