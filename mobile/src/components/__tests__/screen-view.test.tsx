import { expect, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import { ScreenView } from '@/components/screen-view';
import { getLayout } from '@/data/layouts';
import { DbProvider } from '@/db/db-context';
import type { Db } from '@/db/types';
import { addVisit } from '@/db/visits';
import { createDbThatFailsToSave, createTestDb } from '@/test-utils/test-db';

const sillim1 = getLayout('lotte-1007-100701')!;

function renderScreen(db: Db) {
  return render(
    <DbProvider db={db}>
      <ScreenView layout={sillim1} />
    </DbProvider>,
  );
}

test('the grid says there is no record yet when the screen has none', async () => {
  await renderScreen(await createTestDb());

  expect(await screen.findByText('아직 기록이 없어요. 앉았던 좌석을 눌러 기록해 보세요.')).toBeTruthy();
});

test('a seat I sat in is marked on the grid', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-06', height: 3, side: 3 });

  await renderScreen(db);

  expect(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석')).toBeTruthy();
});

test('tapping a marked seat shows that visit\'s date and ratings', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 2, side: 4 });
  await renderScreen(db);

  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));

  expect(await screen.findByText('2026-11-01')).toBeTruthy();
  expect(screen.getByText('조금 낮음')).toBeTruthy();
  expect(screen.getByText('조금 오른쪽')).toBeTruthy();
});

test('saving a visit closes the form and marks the seat', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText('아직 기록이 없어요. 앉았던 좌석을 눌러 기록해 보세요.');

  await user.press(screen.getByLabelText('G열 8번'));
  await user.press(screen.getByLabelText('높이: 딱 좋음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석')).toBeTruthy();
  expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
});

test('a failed save shows "저장하지 못했어요" and keeps what I entered', async () => {
  const user = userEvent.setup();
  await renderScreen(await createDbThatFailsToSave());
  await screen.findByText('아직 기록이 없어요. 앉았던 좌석을 눌러 기록해 보세요.');

  await user.press(screen.getByLabelText('G열 8번'));
  await user.clear(screen.getByLabelText('날짜'));
  await user.type(screen.getByLabelText('날짜'), '2026-11-05');
  await user.press(screen.getByLabelText('높이: 조금 높음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('저장하지 못했어요')).toBeTruthy();
  expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  expect(screen.getByDisplayValue('2026-11-05')).toBeTruthy();
  expect(screen.getByRole('button', { name: '높이: 조금 높음', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '좌우: 딱 좋음', selected: true })).toBeTruthy();
});
