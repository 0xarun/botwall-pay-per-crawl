import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Generate a random string of specified length
function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

// Generate a bot ID (UUID)
export function generateBotId(): string {
  return uuidv4();
}

// Generate a site ID (UUID)
export function generateSiteId(): string {
  return uuidv4();
}

// Generate an API key (format: bw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
export function generateApiKey(): string {
  return `bw_${generateRandomString(32)}`;
}

// Generate a user ID (UUID)
export function generateUserId(): string {
  return uuidv4();
}

// Generate a transaction ID (UUID)
export function generateTransactionId(): string {
  return uuidv4();
}

// Generate a crawl ID (UUID)
export function generateCrawlId(): string {
  return uuidv4();
}

// Generate a site secret (format: ss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)
export function generateSiteSecret(): string {
  return `ss_${generateRandomString(32)}`;
} 