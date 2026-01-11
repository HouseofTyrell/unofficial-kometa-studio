import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, validateMasterKey, generateMasterKey } from './encryption';

describe('Encryption', () => {
  const masterKey = generateMasterKey();
  const plaintext = 'my-secret-token-12345';

  it('should encrypt and decrypt successfully', () => {
    const encrypted = encrypt(plaintext, masterKey);
    const decrypted = decrypt(encrypted, masterKey);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertext for same plaintext', () => {
    const encrypted1 = encrypt(plaintext, masterKey);
    const encrypted2 = encrypt(plaintext, masterKey);
    expect(encrypted1).not.toBe(encrypted2);
  });

  it('should fail decryption with wrong key', () => {
    const encrypted = encrypt(plaintext, masterKey);
    const wrongKey = generateMasterKey();
    expect(() => decrypt(encrypted, wrongKey)).toThrow();
  });

  it('should validate correct master key', () => {
    expect(validateMasterKey(masterKey)).toBe(true);
  });

  it('should reject invalid master key', () => {
    expect(validateMasterKey('invalid')).toBe(false);
    expect(validateMasterKey('aGVsbG8=')).toBe(false); // Too short
  });

  it('should handle unicode characters', () => {
    const unicode = '🔒 Secret Token 你好';
    const encrypted = encrypt(unicode, masterKey);
    const decrypted = decrypt(encrypted, masterKey);
    expect(decrypted).toBe(unicode);
  });
});
