// Centralized configuration for the BotWall Dashboard
export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_BACKEND_URL || 
      (import.meta.env.DEV ? '/api' : 'https://botwall-api.onrender.com/api'),
    timeout: 10000, // 10 seconds
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'BotWall Dashboard',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE,
  },

  // Feature Flags
  features: {
    mockCredits: import.meta.env.VITE_ENABLE_MOCK_CREDITS === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS !== 'false',
  },

  // Environment helpers
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isTest: import.meta.env.MODE === 'test',
} as const;

// Type-safe config access
export type Config = typeof config; 