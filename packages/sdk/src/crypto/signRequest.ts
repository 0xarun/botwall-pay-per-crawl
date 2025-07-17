import nacl from 'tweetnacl';

/**
 * Signs a request using Ed25519 based on the signature-input header.
 * @param headers - Object containing all headers (header names are case-insensitive)
 * @param privateKey - Ed25519 private key (base64-encoded)
 * @returns base64-encoded signature string
 */
export function signRequest(
  headers: Record<string, string>,
  privateKey: string
): string {
  // signature-input header must exist
  const sigInput = headers['signature-input'] || headers['Signature-Input'] || headers['SIGNATURE-INPUT'];
  if (!sigInput) throw new Error('Missing signature-input header');

  // Canonicalize header names (lowercase)
  const headerNames = sigInput.trim().split(/\s+/);
  const message = headerNames.map(h => headers[h.toLowerCase()] || '').join(' ');

  // Decode private key
  const privKeyBytes = Buffer.from(privateKey, 'base64');
  // Sign message
  const signature = nacl.sign.detached(Buffer.from(message), privKeyBytes);
  return Buffer.from(signature).toString('base64');
} 