import type { Db } from './types';

export async function getPref(db: Db, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM prefs WHERE key = ?', [key]);
  return row?.value ?? null;
}

export async function setPref(db: Db, key: string, value: string) {
  await db.runAsync('INSERT INTO prefs (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    value,
  ]);
}
