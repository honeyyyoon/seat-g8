import type { Db } from './types';

export type Rating = 1 | 2 | 3 | 4 | 5;

export type NewVisit = {
  screenId: string;
  seatRow: string;
  seatNumber: number;
  visitDate: string;
  height: Rating;
  side: Rating;
};

export type Visit = NewVisit & { id: number };

export async function addVisit(db: Db, visit: NewVisit) {
  await db.runAsync(
    `INSERT INTO visits (screen_id, seat_row, seat_number, visit_date, status, height, side, created_at)
     VALUES (?, ?, ?, ?, 'watched', ?, ?, ?)`,
    [visit.screenId, visit.seatRow, visit.seatNumber, visit.visitDate, visit.height, visit.side, new Date().toISOString()],
  );
}

export function listVisitsByScreen(db: Db, screenId: string) {
  return db.getAllAsync<Visit>(
    `SELECT id, screen_id AS screenId, seat_row AS seatRow, seat_number AS seatNumber,
            visit_date AS visitDate, height, side
     FROM visits WHERE screen_id = ? ORDER BY visit_date DESC, id DESC`,
    [screenId],
  );
}
