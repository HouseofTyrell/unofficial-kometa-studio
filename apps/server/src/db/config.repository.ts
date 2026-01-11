import { getDatabase } from './database.js';
import type { KometaConfig } from '@kometa-studio/shared';

export interface ConfigRecord {
  id: string;
  name: string;
  description?: string;
  config: KometaConfig;
  createdAt: string;
  updatedAt: string;
}

export class ConfigRepository {
  findAll(): ConfigRecord[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT id, name, description, config, created_at, updated_at
      FROM configs
      ORDER BY updated_at DESC
    `).all();

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      config: JSON.parse(row.config),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  findById(id: string): ConfigRecord | null {
    const db = getDatabase();
    const row: any = db.prepare(`
      SELECT id, name, description, config, created_at, updated_at
      FROM configs
      WHERE id = ?
    `).get(id);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      config: JSON.parse(row.config),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  create(config: Omit<ConfigRecord, 'createdAt' | 'updatedAt'>): ConfigRecord {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO configs (id, name, description, config, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      config.id,
      config.name,
      config.description || null,
      JSON.stringify(config.config),
      now,
      now
    );

    return {
      ...config,
      createdAt: now,
      updatedAt: now,
    };
  }

  update(id: string, updates: Partial<Omit<ConfigRecord, 'id' | 'createdAt' | 'updatedAt'>>): ConfigRecord | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const db = getDatabase();
    const now = new Date().toISOString();

    const name = updates.name ?? existing.name;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const config = updates.config ?? existing.config;

    db.prepare(`
      UPDATE configs
      SET name = ?, description = ?, config = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name,
      description || null,
      JSON.stringify(config),
      now,
      id
    );

    return {
      id,
      name,
      description,
      config,
      createdAt: existing.createdAt,
      updatedAt: now,
    };
  }

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare(`DELETE FROM configs WHERE id = ?`).run(id);
    return result.changes > 0;
  }
}
