import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { config } from "./config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Export API_BASE_URL from centralized config for backward compatibility
export const API_BASE_URL = config.api.baseUrl;

// Export environment helpers from centralized config
export const isDevelopment = config.isDevelopment;
export const isProduction = config.isProduction;
