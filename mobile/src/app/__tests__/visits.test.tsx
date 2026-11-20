import { expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import VisitsScreen from '@/app/visits';
import { DbProvider } from '@/db/db-context';
import { addVisit } from '@/db/visits';
import { createTestDb } from '@/test-utils/test-db';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    ...(jest.requireActual('expo-router') as object),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});

test('every visit is listed by month with how the seat was', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: 'lotte-1007-100701', seatRow: 'G', seatNumber: 8, visitDate: '2026-11-05', height: 3, side: 3 });
  await addVisit(db, {
    screenId: 'megabox-1372-06',
    seatRow: 'A',
    seatNumber: 2,
    visitDate: '2026-10-20',
    height: 1,
    side: 1,
    discomforts: ['legroom'],
  });
  await render(
    <DbProvider db={db}>
      <VisitsScreen />
    </DbProvider>,
  );

  expect(await screen.findByText('기록 2개 · 상영관 2곳')).toBeTruthy();
  expect(screen.getByText('2026년 11월')).toBeTruthy();
  expect(screen.getByText('2026년 10월')).toBeTruthy();
  expect(screen.getByText('좋았음')).toBeTruthy();
  expect(screen.getByText('아쉬움')).toBeTruthy();
});

test('with no visits the list says how to add one', async () => {
  await render(
    <DbProvider db={await createTestDb()}>
      <VisitsScreen />
    </DbProvider>,
  );

  expect(await screen.findByText('아직 기록이 없어요')).toBeTruthy();
});
