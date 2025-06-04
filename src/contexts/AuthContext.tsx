
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types'; // Import the User type

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: User | null; // Add currentUser to the context type
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loadingAuth: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'projetex_auth_status'; // Changed key for uniqueness
const USER_STORAGE_KEY = 'projetex_current_user'; // Key for storing user object

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State for current user
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoadingAuth(true);
    const storedAuthStatus = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (storedAuthStatus === 'true' && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    if (!loadingAuth) {
      if (!isLoggedIn && pathname !== '/login') {
        router.push('/login');
      } else if (isLoggedIn && pathname === '/login') {
        // If logged in and on login page, check role before redirecting
        if (currentUser) { // currentUser should be set if isLoggedIn is true
            router.push('/');
        } else {
            // This case should ideally not happen if logic is correct
            // but as a fallback, if user is logged in but no currentUser, redirect to login to re-auth
            logout(); 
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, loadingAuth, pathname, router, currentUser]);

  const login = useCallback(async (user: string, pass: string): Promise<boolean> => {
    setLoadingAuth(true);
    // Simulate API call for ff.admin
    if (user === 'ff.admin' && pass === 'fastfilms') {
      const userDetails: User = {
        id: 'admin_user_id', // Fixed ID for the admin
        username: user,
        role: 'admin',
        // email is optional and not provided for this hardcoded user
      };
      setIsLoggedIn(true);
      setCurrentUser(userDetails);
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userDetails));
      router.push('/');
      setLoadingAuth(false);
      return true;
    }
    // Add logic here for other users if using Firebase Auth in the future
    // For now, only ff.admin can log in
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setLoadingAuth(false);
    return false;
  }, [router]);

  const logout = useCallback(() => {
    setLoadingAuth(true);
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    router.push('/login');
    setLoadingAuth(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);


  const contextValue = {
    isLoggedIn,
    currentUser, // Expose currentUser
    login,
    logout,
    loadingAuth,
  };

  if (loadingAuth && !isLoggedIn && pathname !== '/login') { // Show loader only if not already rendering login or main content
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render children if:
  // 1. Auth is not loading AND user is logged in (and not on login page, handled by useEffect redirect)
  // 2. Auth is not loading AND user is not logged in AND current path is /login
  // 3. Auth IS loading BUT it's for the login page itself (to avoid full page loader on /login)
  const canRenderChildren = (!loadingAuth && isLoggedIn && pathname !== '/login') || 
                            (!loadingAuth && !isLoggedIn && pathname === '/login') ||
                            (loadingAuth && pathname === '/login');


  return (
    <AuthContext.Provider value={contextValue}>
      { canRenderChildren ? children : (
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) 
      }
    </AuthContext.Provider>
  );
};
