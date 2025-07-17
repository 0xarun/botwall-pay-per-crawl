// BotWall SDK Type Definitions

export interface BotConfig {
  apiKey: string;
  botId: string;
  userAgent?: string;
}

export interface SiteConfig {
  id: string;
  apiUrl?: string;
}

export interface MiddlewareOptions extends SiteConfig {
  // Routes to protect (default: all routes)
  protectedRoutes?: string[];
  // Routes to exclude from protection
  excludedRoutes?: string[];
  // Custom error handler
  onError?: (error: BotWallError) => void;
  // Custom success handler
  onSuccess?: (crawlData: CrawlData) => void;
}

export interface CrawlData {
  botId: string;
  siteId: string;
  path: string;
  userAgent?: string;
  timestamp: string;
}

export interface BotWallError {
  code: 'INVALID_CREDENTIALS' | 'INSUFFICIENT_CREDITS' | 'NETWORK_ERROR' | 'VALIDATION_ERROR';
  message: string;
  status?: number;
  details?: any;
}

export interface VerifyResponse {
  success: boolean;
  status: number;
  message?: string;
  crawlData?: CrawlData;
  remainingCredits?: number;
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  path?: string;
  userAgent?: string;
}

export interface BotWallResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  crawlCost: number;
  remainingCredits: number;
} 