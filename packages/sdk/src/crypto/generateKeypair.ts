import nacl from 'tweetnacl';

/**
 * Generates a new Ed25519 keypair.
 * @returns { publicKey: string, privateKey: string }
 *          Both keys are base64-encoded strings.
 */
export function generateKeypair(): { publicKey: string; privateKey: string } {
  const keypair = nacl.sign.keyPair();
  const publicKey = Buffer.from(keypair.publicKey).toString('base64');
  const privateKey = Buffer.from(keypair.secretKey).toString('base64');
  return { publicKey, privateKey };
} 