
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string in "YYYY-MM-DD" format into a Date object representing
 * midnight in the local timezone, correctly avoiding UTC conversion issues.
 * @param dateString The date string to parse (e.g., "2024-07-10").
 * @returns A Date object, or undefined if the string is invalid or null.
 */
export const parseDateStringAsLocalAtMidnight = (dateString?: string): Date | undefined => {
  if (!dateString) {
    return undefined;
  }

  // Expects dateString to be in "YYYY-MM-DD" format.
  // Using a regex to be more robust against partial inputs.
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    // console.warn(`Invalid date string format provided: "${dateString}". Expected "YYYY-MM-DD".`);
    return undefined;
  }

  const [, year, month, day] = match.map(Number);

  // Basic validation for the parts.
  if (
    isNaN(year) || isNaN(month) || isNaN(day) ||
    year < 1000 || month < 1 || month > 12 || day < 1 || day > 31
  ) {
    // console.warn(`Parsed date parts are invalid: Y=${year}, M=${month}, D=${day}`);
    return undefined;
  }

  // new Date(year, monthIndex, day) creates the date correctly in the local timezone.
  // Month is 0-indexed in JavaScript's Date constructor.
  const localDate = new Date(year, month - 1, day);

  // Final check to ensure the created date is valid (e.g., avoids Feb 30).
  if (localDate.getFullYear() !== year || localDate.getMonth() !== month - 1 || localDate.getDate() !== day) {
    // console.warn(`Date constructor corrected an invalid date: input was Y=${year}, M=${month}, D=${day}`);
    return undefined;
  }

  return localDate;
};
