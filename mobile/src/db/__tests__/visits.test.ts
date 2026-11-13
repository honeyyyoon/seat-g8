import { expect, test } from '@jest/globals';

import { addVisit, deleteVisit, listVisitsByScreen } from '@/db/visits';
import { createTestDb } from '@/test-utils/test-db';

const SILLIM_1 = 'lotte-1007-100701';
const GANGNAM_6 = 'megabox-1372-06';

test('a saved visit shows in that screen\'s visit list', async () => {
  const db = await createTestDb();

  await addVisit(db, { screenId: SILLIM_1, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-06', height: 3, side: 3 });

  expect(await listVisitsByScreen(db, SILLIM_1)).toMatchObject([
    { screenId: SILLIM_1, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-06', height: 3, side: 3 },
  ]);
});

test('a visit from another screen does not show in this screen\'s list', async () => {
  const db = await createTestDb();

  await addVisit(db, { screenId: GANGNAM_6, seatRow: 'C', seatNumber: 5, visitDate: '2026-11-06', height: 2, side: 4 });

  expect(await listVisitsByScreen(db, SILLIM_1)).toEqual([]);
});

test('visits are listed newest first', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: SILLIM_1, seatRow: 'E', seatNumber: 5, visitDate: '2026-09-01', height: 2, side: 3 });
  await addVisit(db, { screenId: SILLIM_1, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-06', height: 3, side: 3 });

  const visits = await listVisitsByScreen(db, SILLIM_1);

  expect(visits.map((v) => v.visitDate)).toEqual(['2026-11-06', '2026-09-01']);
});

test('discomforts are saved with the visit and default to none', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: SILLIM_1, seatRow: 'E', seatNumber: 5, visitDate: '2026-09-01', height: 2, side: 3 });
  await addVisit(db, {
    screenId: SILLIM_1,
    seatRow: 'G',
    seatNumber: 8,
    visitDate: '2026-11-06',
    height: 3,
    side: 3,
    discomforts: ['vent', 'outside_noise'],
  });

  const visits = await listVisitsByScreen(db, SILLIM_1);

  expect(visits.map((v) => v.discomforts)).toEqual([['vent', 'outside_noise'], []]);
});

test('a deleted visit is gone from the list', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: SILLIM_1, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-06', height: 3, side: 3 });
  const [visit] = await listVisitsByScreen(db, SILLIM_1);

  await deleteVisit(db, visit.id);

  expect(await listVisitsByScreen(db, SILLIM_1)).toEqual([]);
});
