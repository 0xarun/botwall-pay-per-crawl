import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

export function verifyEd25519Signature(
  headers: Record<string, string>,
  signature: string,
  publicKey: string
): boolean {
  try {
    const sigInput = headers['signature-input'];
    if (!sigInput) return false;
    // Assume signature-input is a space-separated list of header names
    const headerNames = sigInput.trim().split(/\s+/);
    const message = headerNames.map(h => headers[h.toLowerCase()] || '').join(' ');
    const sig = Buffer.from(signature, 'base64');
    const pub = Buffer.from(publicKey, 'base64');
    return nacl.sign.detached.verify(
      Buffer.from(message),
      sig,
      pub
    );
  } catch {
    return false;
  }
} 