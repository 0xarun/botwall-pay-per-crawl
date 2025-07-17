// BotWall SDK Main Entry Point

// Export types
export type {
  BotConfig,
  SiteConfig,
  MiddlewareOptions,
  CrawlData,
  BotWallError,
  VerifyResponse,
  FetchOptions,
  BotWallResponse
} from './types';

// Export error classes
export {
  BotWallSDKError,
  InvalidCredentialsError,
  InsufficientCreditsError,
  NetworkError,
  ValidationError,
  createErrorFromResponse
} from './errors';

// Export client
export { BotWallClient } from './client';

// Remove middleware exports that do not exist
// export { payPerCrawlMiddleware, requireBotWallMiddleware } from './middleware';
// export type { BotWallRequest } from './middleware';

// Remove fetchWithCredits and deductCredits convenience functions if not implemented in BotWallClient
// Remove default export if it references undefined variables 
export { generateKeypair } from './crypto/generateKeypair';
export { signRequest } from './crypto/signRequest';
export { sendCrawlRequest } from './client/sendCrawlRequest'; 