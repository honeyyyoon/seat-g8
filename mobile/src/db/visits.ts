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
  movie?: string | null;
};

export type Visit = Omit<NewVisit, 'discomforts' | 'movie'> & { id: number; discomforts: Discomfort[]; movie: string | null };

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
    `INSERT INTO visits (screen_id, seat_row, seat_number, visit_date, status, height, side, discomforts, movie, created_at)
     VALUES (?, ?, ?, ?, 'watched', ?, ?, ?, ?, ?)`,
    [
      visit.screenId,
      visit.seatRow,
      visit.seatNumber,
      visit.visitDate,
      visit.height,
      visit.side,
      JSON.stringify(visit.discomforts ?? []),
      visit.movie?.trim() || null,
      new Date().toISOString(),
    ],
  );
}

const SELECT_VISITS = `SELECT id, screen_id AS screenId, seat_row AS seatRow, seat_number AS seatNumber,
            visit_date AS visitDate, height, side, discomforts, movie
     FROM visits`;

async function selectVisits(db: Db, where: string, params: (string | number)[]): Promise<Visit[]> {
  const rows = await db.getAllAsync<VisitRow>(`${SELECT_VISITS} ${where} ORDER BY visit_date DESC, id DESC`, params);
  return rows.map((row) => ({ ...row, discomforts: parseDiscomforts(row.discomforts) }));
}

export function listVisitsByScreen(db: Db, screenId: string): Promise<Visit[]> {
  return selectVisits(db, 'WHERE screen_id = ?', [screenId]);
}

export function listAllVisits(db: Db): Promise<Visit[]> {
  return selectVisits(db, '', []);
}

export async function deleteVisit(db: Db, id: number) {
  await db.runAsync('DELETE FROM visits WHERE id = ?', [id]);
}
