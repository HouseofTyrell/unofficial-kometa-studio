import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const _AUTH_TAG_LENGTH = 16; // GCM auth tag length (documented for reference)
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

interface EncryptedEnvelope {
  version: number;
  salt: string;
  iv: string;
  authTag: string;
  encrypted: string;
}

/**
 * Derives a key from the master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    Buffer.from(masterKey, 'base64'),
    salt,
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(plaintext: string, masterKey: string): string {
  try {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(masterKey, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    const envelope: EncryptedEnvelope = {
      version: 1,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      encrypted,
    };

    return JSON.stringify(envelope);
  } catch (error) {
    throw new Error(
      `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Decrypts data using AES-256-GCM
 */
export function decrypt(envelopeStr: string, masterKey: string): string {
  try {
    const envelope: EncryptedEnvelope = JSON.parse(envelopeStr);

    if (envelope.version !== 1) {
      throw new Error(`Unsupported encryption version: ${envelope.version}`);
    }

    const salt = Buffer.from(envelope.salt, 'base64');
    const key = deriveKey(masterKey, salt);
    const iv = Buffer.from(envelope.iv, 'base64');
    const authTag = Buffer.from(envelope.authTag, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(envelope.encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Validates that a master key is properly formatted
 */
export function validateMasterKey(masterKey: string): boolean {
  try {
    const buffer = Buffer.from(masterKey, 'base64');
    return buffer.length === KEY_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Generates a new master key
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64');
}
