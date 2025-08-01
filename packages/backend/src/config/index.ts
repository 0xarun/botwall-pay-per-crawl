// Centralized configuration for the BotWall Backend
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase'),
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS Configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },

  // Payment Configuration (LemonSqueezy)
  payments: {
    lemonsqueezy: {
      apiKey: process.env.LEMONSQUEEZY_API_KEY,
      storeId: process.env.LEMONSQUEEZY_STORE_ID,
      webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    },
  },

  // Feature Flags
  features: {
    mockCredits: process.env.ENABLE_MOCK_CREDITS === 'true',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

// Type-safe config access
export type Config = typeof config;

// Validation function to ensure required environment variables are set
export function validateConfig(): void {
  const required = [
    'JWT_SECRET',
    'DATABASE_URL',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 