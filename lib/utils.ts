import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility per combinare classi Tailwind in modo sicuro
 * Usa clsx per la logica condizionale e tailwind-merge per risolvere conflitti
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
