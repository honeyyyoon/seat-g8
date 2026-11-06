import type { Db } from './types';

export async function migrate(db: Db) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
  if ((row?.user_version ?? 0) < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screen_id TEXT NOT NULL,
        seat_row TEXT NOT NULL,
        seat_number INTEGER NOT NULL,
        visit_date TEXT NOT NULL,
        start_time TEXT,
        status TEXT NOT NULL,
        height INTEGER,
        side INTEGER,
        discomforts TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS visits_by_screen ON visits (screen_id, visit_date);
      PRAGMA user_version = 1;
    `);
  }
}
