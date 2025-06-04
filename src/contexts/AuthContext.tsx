
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { User as AppUser } from '@/types'; // Renamed to avoid conflict with Firebase User
import { auth, db } from '@/lib/firebase'; // Import Firebase auth and db
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  type User as FirebaseUser // Firebase User type
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loadingAuth: boolean;
  setLoginError: (message: string | null) => void; // To show errors on login page
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loginError, setLoginErrorState] = useState<string | null>(null); // For login page errors
  const router = useRouter();
  const pathname = usePathname();

  const setLoginError = (message: string | null) => {
    setLoginErrorState(message);
  };

  useEffect(() => {
    setLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in with Firebase Auth
        // Fetch user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const appUserData = userDocSnap.data() as Omit<AppUser, 'id'>;
          setCurrentUser({ ...appUserData, id: firebaseUser.uid });
          setIsLoggedIn(true);
          if (pathname === '/login') {
            router.push('/');
          }
        } else {
          // User exists in Firebase Auth but not in Firestore 'users' collection
          // This is an inconsistent state, log them out from the app's perspective
          console.error("User profile not found in Firestore. Logging out.");
          await firebaseSignOut(auth); // Sign out from Firebase Auth
          setCurrentUser(null);
          setIsLoggedIn(false);
          // router.push('/login'); // onAuthStateChanged will trigger again with null
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsLoggedIn(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); // Add pathname and router to ensure correct redirection logic

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setLoadingAuth(true);
    setLoginError(null); // Clear previous errors
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle setting isLoggedIn, currentUser, and redirecting
      // setLoadingAuth(false) will be handled by onAuthStateChanged
      return true; // Indicates Firebase login attempt was successful
    } catch (error: any) {
      console.error("Firebase Auth login error:", error);
      let errorMessage = 'Email ou senha inválidos.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou senha inválidos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O formato do email é inválido.';
      } else {
        errorMessage = 'Ocorreu um erro ao tentar fazer login. Tente novamente.';
      }
      setLoginError(errorMessage); // Set error for login page
      setCurrentUser(null);
      setIsLoggedIn(false);
      setLoadingAuth(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoadingAuth(true);
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting isLoggedIn to false, currentUser to null, and redirecting
    } catch (error) {
      console.error("Firebase Auth logout error:", error);
    }
    // setLoadingAuth(false) will be handled by onAuthStateChanged
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const contextValue = {
    isLoggedIn,
    currentUser,
    login,
    logout,
    loadingAuth,
    setLoginError, // Expose setLoginError
  };
  
  if (loadingAuth && pathname !== '/login') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
