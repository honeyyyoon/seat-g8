import { expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import TheaterScreen from '@/app/theaters/[theaterId]';
import { DbProvider } from '@/db/db-context';
import { addVisit } from '@/db/visits';
import { createTestDb } from '@/test-utils/test-db';

jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    ...(jest.requireActual('expo-router') as object),
    useLocalSearchParams: () => ({ theaterId: 'lotte-1007' }),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
    Stack: { Screen: () => null },
  };
});

test('a theater page shows my visits there and its screens', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: 'lotte-1007-100701', seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 3, side: 3 });
  await addVisit(db, { screenId: 'megabox-1372-06', seatRow: 'C', seatNumber: 5, visitDate: '2026-11-02', height: 3, side: 3 });
  await render(
    <DbProvider db={db}>
      <TheaterScreen />
    </DbProvider>,
  );

  expect(await screen.findByText('G열 8번')).toBeTruthy();
  expect(screen.queryByText('C열 5번')).toBeNull();
  expect(screen.getByText(/내 기록 1개/)).toBeTruthy();
  expect(screen.getByRole('link', { name: /^1관, \d+석, 내 기록 1개$/ })).toBeTruthy();
});
