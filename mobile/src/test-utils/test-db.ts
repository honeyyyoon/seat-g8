import Database from 'better-sqlite3';

import { migrate } from '@/db/migrate';
import type { Db } from '@/db/types';

export async function createTestDb(): Promise<Db> {
  const sqlite = new Database(':memory:');
  const db: Db = {
    async execAsync(source) {
      sqlite.exec(source);
    },
    async runAsync(source, params) {
      return sqlite.prepare(source).run(...params);
    },
    async getAllAsync<T>(source: string, params: (string | number | null)[]) {
      return sqlite.prepare(source).all(...params) as T[];
    },
    async getFirstAsync<T>(source: string, params: (string | number | null)[]) {
      return (sqlite.prepare(source).get(...params) as T | undefined) ?? null;
    },
  };
  await migrate(db);
  return db;
}

export async function createDbThatFailsToSave(): Promise<Db> {
  const db = await createTestDb();
  return { ...db, runAsync: () => Promise.reject(new Error('disk full')) };
}
