
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string in "YYYY-MM-DD", a Date object, or a Firestore Timestamp-like object,
 * returning a Date object representing midnight in the local timezone.
 * @param dateInput The date string, Date object, or Firestore Timestamp-like object to parse.
 * @returns A Date object, or undefined if the input is invalid or null.
 */
export const parseDateStringAsLocalAtMidnight = (dateInput?: string | Date | { toDate: () => Date }): Date | undefined => {
  if (!dateInput) {
    return undefined;
  }

  // Handle Firestore Timestamp-like objects (which have a toDate method)
  if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput && typeof (dateInput as any).toDate === 'function') {
      const convertedDate = (dateInput as { toDate: () => Date }).toDate();
      return isValid(convertedDate) ? convertedDate : undefined;
  }

  // If the input is already a Date object, check its validity and return it.
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : undefined;
  }

  if (typeof dateInput !== 'string') {
    return undefined;
  }

  // To avoid timezone issues where "YYYY-MM-DD" is interpreted as UTC midnight,
  // we explicitly parse the components and create a local date.
  // This regex now matches strings that START with "YYYY-MM-DD".
  const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match.map(Number);

    // Basic validation for the parts.
    if (
      isNaN(year) || isNaN(month) || isNaN(day) ||
      year < 1000 || month < 1 || month > 12 || day < 1 || day > 31
    ) {
      return undefined;
    }
    
    // new Date(year, monthIndex, day) creates the date correctly in the local timezone.
    const localDate = new Date(year, month - 1, day);

    // Final check to ensure the created date is valid (e.g., avoids Feb 30).
    if (localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day) {
      return undefined;
    }

    return localDate;
  }
  
  // As a fallback for other formats, try the native parser.
  const genericDate = new Date(dateInput);
  return isValid(genericDate) ? genericDate : undefined;
};

    