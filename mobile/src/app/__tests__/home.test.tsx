import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { DbProvider } from '@/db/db-context';
import { getPref, setPref } from '@/db/prefs';
import type { Db } from '@/db/types';
import { addVisit } from '@/db/visits';
import { createTestDb } from '@/test-utils/test-db';

const permission = { granted: false };

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: async () => permission,
  requestForegroundPermissionsAsync: async () => ({ granted: true }),
  getLastKnownPositionAsync: async () => ({ coords: { latitude: 37.48379, longitude: 126.930192 } }),
  getCurrentPositionAsync: async () => null,
  Accuracy: { Balanced: 3 },
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-router', () => {
  const { useEffect } = require('react');
  return {
    ...(jest.requireActual('expo-router') as object),
    useFocusEffect: (effect: () => void) => useEffect(effect, [effect]),
  };
});

async function seenGuideDb() {
  const db = await createTestDb();
  await setPref(db, 'onboarding_done', '1');
  return db;
}

async function renderHome(db?: Db) {
  return render(
    <DbProvider db={db ?? (await seenGuideDb())}>
      <HomeScreen />
    </DbProvider>,
  );
}

test('searching opens the matching theater and shows its screens', async () => {
  const user = userEvent.setup();
  await renderHome();

  await user.type(screen.getByLabelText('극장·상영관 검색'), '코엑스 돌비');

  expect(screen.getByText('검색 결과 1개')).toBeTruthy();
  expect(screen.getByText('DOLBY CINEMA')).toBeTruthy();
  expect(screen.queryByText('신림')).toBeNull();
});

test('a search with no match says so and can be cleared', async () => {
  const user = userEvent.setup();
  await renderHome();

  await user.type(screen.getByLabelText('극장·상영관 검색'), '부산');
  expect(screen.getByText('‘부산’에 맞는 상영관이 없어요')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: '검색 지우기' }));
  expect(screen.getByText('극장 62곳 · 상영관 462개')).toBeTruthy();
  expect(screen.getByRole('link', { name: /^롯데시네마, 극장/ })).toBeTruthy();
});

test('the guide opens on first launch and stays closed after it is finished', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await renderHome(db);

  expect(await screen.findByText('상영관 찾기')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByText('앉았던 좌석 누르기')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '다음' }));
  await user.press(screen.getByRole('button', { name: '시작하기' }));

  expect(screen.queryByText('높이와 좌우 남기기')).toBeNull();
  expect(await getPref(db, 'onboarding_done')).toBe('1');
});

test('home shows the three latest visits', async () => {
  const db = await seenGuideDb();
  for (const [row, date] of [['A', '2026-10-01'], ['B', '2026-10-02'], ['C', '2026-10-03'], ['D', '2026-10-04']] as const) {
    await addVisit(db, { screenId: 'lotte-1007-100701', seatRow: row, seatNumber: 1, visitDate: date, height: 3, side: 3 });
  }
  await renderHome(db);

  expect(await screen.findByText('최근 기록')).toBeTruthy();
  expect(screen.getByText('전체 4개')).toBeTruthy();
  expect(screen.getByText('D열 1번')).toBeTruthy();
  expect(screen.queryByText('A열 1번')).toBeNull();
});

test('nearby lists the closest theaters first and shows more on request', async () => {
  const user = userEvent.setup();
  await renderHome();

  await user.press(screen.getByRole('button', { name: '가까운 순' }));

  expect(await screen.findByText('가까운 극장')).toBeTruthy();
  const theaterLinks = () => screen.getAllByRole('link', { name: /, \d+(\.\d)?k?m$/ });
  expect(theaterLinks()).toHaveLength(8);
  expect(theaterLinks()[0]).toHaveProp('accessibilityLabel', '롯데시네마 신림, 0m');

  await user.press(screen.getByRole('button', { name: '더보기' }));
  expect(theaterLinks()).toHaveLength(18);
});

test('home lists the three chains instead of every theater', async () => {
  await renderHome();

  expect(screen.getByRole('link', { name: /^CGV, 극장 \d+곳$/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: /^롯데시네마, 극장 \d+곳$/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: /^메가박스, 극장 \d+곳$/ })).toBeTruthy();
  expect(screen.queryByText('신림')).toBeNull();
});

test('recent visits can be folded and stay folded', async () => {
  const user = userEvent.setup();
  const db = await seenGuideDb();
  await addVisit(db, { screenId: 'lotte-1007-100701', seatRow: 'D', seatNumber: 3, visitDate: '2026-11-01', height: 3, side: 3 });
  await renderHome(db);

  expect(await screen.findByText('D열 3번')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '최근 기록' }));

  expect(screen.queryByText('D열 3번')).toBeNull();
  expect(await getPref(db, 'recent_collapsed')).toBe('1');
});

test('home opens on nearby when location is already allowed', async () => {
  permission.granted = true;
  await renderHome();

  expect(await screen.findByText('가까운 극장')).toBeTruthy();
  expect(screen.getByRole('button', { name: '가까운 순' })).toHaveProp('accessibilityState', { selected: true });
  permission.granted = false;
});
