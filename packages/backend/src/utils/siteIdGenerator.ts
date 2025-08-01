import { randomBytes } from 'crypto';

/**
 * Generates a unique site ID for middleware configuration
 * Format: site_xxxxxxxxxxxx (12 random hex characters)
 */
export function generateSiteId(): string {
  const randomHex = randomBytes(6).toString('hex');
  return `site_${randomHex}`;
}

/**
 * Validates if a site ID has the correct format
 */
export function isValidSiteId(siteId: string): boolean {
  return /^site_[a-f0-9]{12}$/.test(siteId);
} 