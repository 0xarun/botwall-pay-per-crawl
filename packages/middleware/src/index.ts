// Main middleware validation function
export { validateCrawlRequest } from './validateCrawlRequest';

// Ed25519 signature verification
export { verifyEd25519Signature } from './verifyEd25519Signature';

// Health check functionality
export { 
  MiddlewareHealthChecker, 
  startHealthCheck,
  type HealthCheckOptions,
  type HealthCheckResult 
} from './healthCheck';

// Re-export types for convenience
export type { ValidateCrawlRequestOptions } from './validateCrawlRequest'; 