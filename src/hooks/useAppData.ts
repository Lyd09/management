
"use client";

import { useContext } from 'react';
import { AppDataContext } from '@/contexts/AppDataContext';

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
