
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses a date string in "YYYY-MM-DD" format into a Date object representing
 * midnight in the local timezone.
 * @param dateString The date string to parse.
 * @returns A Date object, or undefined if the string is invalid.
 */
export const parseDateStringAsLocalAtMidnight = (dateString?: string): Date | undefined => {
  if (!dateString) return undefined;
  // Regex to ensure YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // console.warn(`Invalid date string format for parseDateStringAsLocalAtMidnight: ${dateString}`);
    return undefined;
  }

  const parts = dateString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
  const day = parseInt(parts[2], 10);

  // Create a new Date object. This will be in the local timezone by default for year, month, day.
  const date = new Date(year, month, day, 0, 0, 0, 0);

  // Basic validation: check if the date parts set match the parts read
  // This helps catch invalid dates like February 30th
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    // console.warn(`Constructed date does not match input string for parseDateStringAsLocalAtMidnight: ${dateString}`);
    return undefined;
  }
  return date;
};
