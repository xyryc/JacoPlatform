import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge"

/**
 * Utility for merging Tailwind CSS classes with clsx 
 * and tailwind-merge to avoid class collisions.
 * 
 * @param inputs - Array of class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
