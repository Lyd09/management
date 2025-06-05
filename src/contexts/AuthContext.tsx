
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
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  login: (usernameOrEmail: string, pass: string) => Promise<boolean>; // Can be username or email
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
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const appUserData = userDocSnap.data() as Omit<AppUser, 'id'>;
          const finalUserData = { ...appUserData, id: firebaseUser.uid };
          setCurrentUser(finalUserData);
          setIsLoggedIn(true);
          if (pathname === '/login') {
            router.push('/');
          }
        } else {
          console.error(`[AuthContext] User profile not found in Firestore for UID: ${firebaseUser.uid}. Logging out.`);
          await firebaseSignOut(auth); 
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]); 

  const login = useCallback(async (usernameOrEmail: string, pass: string): Promise<boolean> => {
    setLoadingAuth(true);
    setLoginError(null);
    let emailToUse = usernameOrEmail;

    // Check if it's an email or username
    if (!usernameOrEmail.includes('@')) { // Simple check, assumes username doesn't have '@'
      // It's a username, try to find the email
      const usersCollectionRef = collection(db, 'users');
      const q = query(usersCollectionRef, where('username', '==', usernameOrEmail));
      
      try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          setLoginError('Nome de usuário ou senha inválidos.');
          setLoadingAuth(false);
          return false;
        }
        // Assuming usernames are unique
        const userData = querySnapshot.docs[0].data() as AppUser;
        if (!userData.email) {
          setLoginError('Conta de usuário não configurada corretamente (sem email).');
          setLoadingAuth(false);
          return false;
        }
        emailToUse = userData.email;
      } catch (error) {
        console.error("Error fetching user by username:", error);
        setLoginError('Erro ao tentar encontrar o usuário.');
        setLoadingAuth(false);
        return false;
      }
    }

    // At this point, emailToUse should be the email (either provided directly or fetched)
    try {
      await signInWithEmailAndPassword(auth, emailToUse, pass);
      return true;
    } catch (error: any) {
      console.error("Firebase Auth login error:", error);
      let errorMessage = 'Nome de usuário/Email ou senha inválidos.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Nome de usuário/Email ou senha inválidos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'O formato do email é inválido.';
      } else {
        errorMessage = 'Ocorreu um erro ao tentar fazer login. Tente novamente.';
      }
      setLoginError(errorMessage);
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
    } catch (error) {
      console.error("Firebase Auth logout error:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const contextValue = {
    isLoggedIn,
    currentUser,
    login,
    logout,
    loadingAuth,
    setLoginError, 
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
