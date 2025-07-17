import { signRequest } from '../crypto/signRequest';

/**
 * Sends a crawl request, auto-signing the headers using Ed25519.
 * @param url - The URL to fetch
 * @param headers - Headers object (must include signature-input and required headers)
 * @param privateKey - Ed25519 private key (base64-encoded)
 * @param options - Optional fetch options (method, body, etc.)
 * @returns The fetch Response object
 */
export async function sendCrawlRequest(
  url: string,
  headers: Record<string, string>,
  privateKey: string,
  options: RequestInit = {}
): Promise<Response> {
  // Sign the request
  const signature = signRequest(headers, privateKey);
  const signedHeaders = { ...headers, signature };

  // Prepare fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers: signedHeaders,
  };

  // Send the request
  return fetch(url, fetchOptions);
} 