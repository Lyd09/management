
"use client";

import { useContext } from 'react';
import { GoogleCalendarContext } from '@/contexts/GoogleCalendarContext';

export const useGoogleCalendar = () => {
  const context = useContext(GoogleCalendarContext);
  if (context === undefined) {
    throw new Error('useGoogleCalendar must be used within a GoogleCalendarProvider');
  }
  return context;
};
