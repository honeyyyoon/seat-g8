import type { Discomfort } from '@/constants/ratings';

import type { Db } from './types';

export type Rating = 1 | 2 | 3 | 4 | 5;

export type NewVisit = {
  screenId: string;
  seatRow: string;
  seatNumber: number;
  visitDate: string;
  height: Rating;
  side: Rating;
  discomforts?: Discomfort[];
};

export type Visit = Omit<NewVisit, 'discomforts'> & { id: number; discomforts: Discomfort[] };

type VisitRow = Omit<Visit, 'discomforts'> & { discomforts: string };

function parseDiscomforts(json: string): Discomfort[] {
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export async function addVisit(db: Db, visit: NewVisit) {
  await db.runAsync(
    `INSERT INTO visits (screen_id, seat_row, seat_number, visit_date, status, height, side, discomforts, created_at)
     VALUES (?, ?, ?, ?, 'watched', ?, ?, ?, ?)`,
    [
      visit.screenId,
      visit.seatRow,
      visit.seatNumber,
      visit.visitDate,
      visit.height,
      visit.side,
      JSON.stringify(visit.discomforts ?? []),
      new Date().toISOString(),
    ],
  );
}

export async function listVisitsByScreen(db: Db, screenId: string): Promise<Visit[]> {
  const rows = await db.getAllAsync<VisitRow>(
    `SELECT id, screen_id AS screenId, seat_row AS seatRow, seat_number AS seatNumber,
            visit_date AS visitDate, height, side, discomforts
     FROM visits WHERE screen_id = ? ORDER BY visit_date DESC, id DESC`,
    [screenId],
  );
  return rows.map((row) => ({ ...row, discomforts: parseDiscomforts(row.discomforts) }));
}

export async function deleteVisit(db: Db, id: number) {
  await db.runAsync('DELETE FROM visits WHERE id = ?', [id]);
}
