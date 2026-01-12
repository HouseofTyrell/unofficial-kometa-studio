import { getDatabase } from './database.js';
import type { ProfileSecrets } from '@kometa-studio/shared';
import { encrypt, decrypt } from '../crypto/encryption.js';

export interface ProfileRecord {
  id: string;
  name: string;
  description?: string;
  secrets: ProfileSecrets;
  createdAt: string;
  updatedAt: string;
}

export class ProfileRepository {
  constructor(private masterKey: string) {}

  findAll(): Omit<ProfileRecord, 'secrets'>[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `
      SELECT id, name, description, created_at, updated_at
      FROM profiles
      ORDER BY updated_at DESC
    `
      )
      .all();

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  findById(id: string): ProfileRecord | null {
    const db = getDatabase();
    const row: any = db
      .prepare(
        `
      SELECT id, name, description, secrets_encrypted, created_at, updated_at
      FROM profiles
      WHERE id = ?
    `
      )
      .get(id);

    if (!row) return null;

    const secrets = JSON.parse(decrypt(row.secrets_encrypted, this.masterKey));

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      secrets,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  create(profile: Omit<ProfileRecord, 'createdAt' | 'updatedAt'>): ProfileRecord {
    const db = getDatabase();
    const now = new Date().toISOString();

    const secretsEncrypted = encrypt(JSON.stringify(profile.secrets), this.masterKey);

    db.prepare(
      `
      INSERT INTO profiles (id, name, description, secrets_encrypted, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(profile.id, profile.name, profile.description || null, secretsEncrypted, now, now);

    return {
      ...profile,
      createdAt: now,
      updatedAt: now,
    };
  }

  update(
    id: string,
    updates: Partial<Omit<ProfileRecord, 'id' | 'createdAt' | 'updatedAt'>>
  ): ProfileRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const db = getDatabase();
    const now = new Date().toISOString();

    const name = updates.name ?? existing.name;
    const description =
      updates.description !== undefined ? updates.description : existing.description;
    const secrets = updates.secrets ?? existing.secrets;

    const secretsEncrypted = encrypt(JSON.stringify(secrets), this.masterKey);

    db.prepare(
      `
      UPDATE profiles
      SET name = ?, description = ?, secrets_encrypted = ?, updated_at = ?
      WHERE id = ?
    `
    ).run(name, description || null, secretsEncrypted, now, id);

    return {
      id,
      name,
      description,
      secrets,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare(`DELETE FROM profiles WHERE id = ?`).run(id);
    return result.changes > 0;
  }
}
