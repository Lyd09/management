
"use client";

import type { ReactNode } from 'react';
import React, from 'react';
import { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getGoogleAuthUrl } from '@/lib/google-auth';
import Cookies from 'js-cookie';

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  scope: string;
}

interface GoogleCalendarContextType {
  isCalendarConnected: boolean;
  connectCalendar: () => void;
  disconnectCalendar: () => void;
  getTokens: () => GoogleTokens | null;
  loading: boolean;
}

export const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export const GoogleCalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<GoogleTokens | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedTokens = Cookies.get('google-tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        // Verificar se os tokens expiraram
        if (parsedTokens.expiry_date && new Date().getTime() < parsedTokens.expiry_date) {
          setTokens(parsedTokens);
        } else {
          // Se expirou e não tem refresh token, limpa
           if (!parsedTokens.refresh_token) {
             Cookies.remove('google-tokens');
           }
           // Lógica para refresh token iria aqui
        }
      } catch (e) {
        console.error("Failed to parse Google tokens from cookie", e);
        Cookies.remove('google-tokens');
      }
    }
    setLoading(false);
  }, []);

  const connectCalendar = useCallback(() => {
    const authUrl = getGoogleAuthUrl();
    window.location.href = authUrl;
  }, []);

  const disconnectCalendar = useCallback(() => {
    setTokens(null);
    Cookies.remove('google-tokens');
    // Adicionar um toast ou notificação aqui seria uma boa melhoria
  }, []);
  
  const getTokens = useCallback(() => {
      return tokens;
  }, [tokens]);

  const isCalendarConnected = !!tokens;

  const contextValue = {
    isCalendarConnected,
    connectCalendar,
    disconnectCalendar,
    getTokens,
    loading,
  };

  return (
    <GoogleCalendarContext.Provider value={contextValue}>
      {children}
    </GoogleCalendarContext.Provider>
  );
};
