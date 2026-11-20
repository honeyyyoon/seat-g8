import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ScreenView } from '@/components/screen-view';
import { getLayout } from '@/data/layouts';
import { DbProvider } from '@/db/db-context';
import type { Db } from '@/db/types';
import { addVisit } from '@/db/visits';
import { createDbThatFailsToSave, createTestDb } from '@/test-utils/test-db';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

const sillim1 = getLayout('lotte-1007-100701')!;
const EMPTY = '앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.';

function renderScreen(db: Db) {
  return render(
    <GestureHandlerRootView>
      <DbProvider db={db}>
        <ScreenView layout={sillim1} />
      </DbProvider>
    </GestureHandlerRootView>,
  );
}

async function pickDate(user: ReturnType<typeof userEvent.setup>, date: Date) {
  await user.press(screen.getByRole('button', { name: /^날짜, / }));
  await fireEvent(screen.getByTestId('visit-date-calendar'), 'onChange', { nativeEvent: { timestamp: date.getTime() } });
}

test('the grid says there is no record yet when the screen has none', async () => {
  await renderScreen(await createTestDb());

  expect(await screen.findByText('앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.')).toBeTruthy();
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

  expect(await screen.findByText('2026년 11월 1일 (일)')).toBeTruthy();
  expect(screen.getByText('조금 낮음')).toBeTruthy();
  expect(screen.getByText('조금 오른쪽')).toBeTruthy();
});

test('saving a visit closes the form and marks the seat', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText('앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.');

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
  await screen.findByText('앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.');

  await user.press(screen.getByLabelText('G열 8번'));
  await pickDate(user, new Date(2026, 10, 5));
  await user.press(screen.getByLabelText('높이: 조금 높음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('저장하지 못했어요')).toBeTruthy();
  expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '날짜, 2026년 11월 5일 (목)' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '높이: 조금 높음', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '좌우: 딱 좋음', selected: true })).toBeTruthy();
});

test('picking a date in the calendar saves that date', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await renderScreen(db);
  await screen.findByText('앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.');

  await user.press(screen.getByLabelText('G열 8번'));
  await pickDate(user, new Date(2026, 9, 31));
  expect(screen.queryByTestId('visit-date-calendar')).toBeNull();
  await user.press(screen.getByLabelText('높이: 딱 좋음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));

  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));
  expect(await screen.findByText('2026년 10월 31일 (토)')).toBeTruthy();
});

test('discomforts I check are shown with that visit', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText('앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.');

  await user.press(screen.getByLabelText('G열 8번'));
  await user.press(screen.getByLabelText('높이: 딱 좋음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByLabelText('불편: 냉난방'));
  await user.press(screen.getByLabelText('불편: 의자'));
  await user.press(screen.getByLabelText('불편: 의자'));
  expect(screen.getByRole('checkbox', { name: '불편: 냉난방', checked: true })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: '불편: 의자', checked: false })).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '저장' }));

  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));
  expect(await screen.findByText('불편했던 점')).toBeTruthy();
  expect(screen.getByText('냉난방')).toBeTruthy();
  expect(screen.queryByText('의자')).toBeNull();
});

test('deleting one of two visits keeps the other on that seat', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-10-01', height: 3, side: 3 });
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 2, side: 4 });
  await renderScreen(db);

  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));
  await user.press(screen.getByRole('button', { name: '2026년 11월 1일 (일) 기록 삭제' }));

  expect(await screen.findByText('이 좌석에 1번 앉았어요')).toBeTruthy();
  expect(screen.getByText('2026년 10월 1일 (목)')).toBeTruthy();
  expect(screen.queryByText('2026년 11월 1일 (일)')).toBeNull();
});

test('deleting the only visit on a seat unmarks it', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 2, side: 4 });
  await renderScreen(db);

  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));
  await user.press(screen.getByRole('button', { name: '2026년 11월 1일 (일) 기록 삭제' }));

  expect(await screen.findByText(EMPTY)).toBeTruthy();
  expect(screen.queryByLabelText('G열 8번, 내가 앉았던 좌석')).toBeNull();
});

test('a deleted visit can be brought back from the toast', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 2, side: 4 });
  await renderScreen(db);

  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));
  await user.press(screen.getByRole('button', { name: '2026년 11월 1일 (일) 기록 삭제' }));
  expect(await screen.findByText('기록을 지웠어요')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '되돌리기' }));

  expect(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석')).toBeTruthy();
});

test('typing a row and number selects that seat', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.type(screen.getByLabelText('열'), 'g');
  await user.type(screen.getByLabelText('번'), '8');
  await user.press(screen.getByRole('button', { name: '좌석 선택' }));

  expect(await screen.findByText('G열 8번')).toBeTruthy();
  expect(screen.getByRole('button', { name: '저장' })).toBeTruthy();
});

test('picking a row and number from the lists selects that seat', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.press(screen.getByRole('button', { name: 'G열' }));
  await user.press(screen.getByRole('button', { name: '8번' }));
  expect(screen.getByDisplayValue('G')).toBeTruthy();
  expect(screen.getByDisplayValue('8')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '좌석 선택' }));

  expect(await screen.findByText('G열 8번')).toBeTruthy();
});

test('picking a seat number highlights that seat on the grid', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.press(screen.getByRole('button', { name: 'G열' }));
  expect(screen.getByRole('button', { name: 'G열 8번' }).props.accessibilityState).toEqual({ selected: false });

  await user.press(screen.getByRole('button', { name: '8번' }));
  expect(screen.getByRole('button', { name: 'G열 8번' }).props.accessibilityState).toEqual({ selected: true });
  expect(screen.getByRole('button', { name: 'G열 9번' }).props.accessibilityState).toEqual({ selected: false });
});

test('a seat number that is not in this screen says so', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.type(screen.getByLabelText('열'), 'Z');
  await user.type(screen.getByLabelText('번'), '99');
  await user.press(screen.getByRole('button', { name: '좌석 선택' }));

  expect(screen.getByText('Z열 99번은 이 상영관에 없어요')).toBeTruthy();
  expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
});

test('a marked seat is colored by how it went', async () => {
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 1, side: 3, discomforts: ['chair'] });
  await renderScreen(db);

  const seat = await screen.findByLabelText('G열 8번, 내가 앉았던 좌석');
  expect(seat.props.accessibilityValue).toEqual({ text: '아쉬움' });
  expect(screen.getByText('아쉬웠던 좌석')).toBeTruthy();
});

test('a movie title can be saved with the visit and shows in its detail', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.press(screen.getByLabelText('G열 8번'));
  await user.type(screen.getByLabelText('영화 제목'), '듄: 파트 2');
  await user.press(screen.getByLabelText('높이: 딱 좋음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));
  await user.press(await screen.findByLabelText('G열 8번, 내가 앉았던 좌석'));

  expect(await screen.findAllByText('듄: 파트 2')).toHaveLength(2);
});

test('saving a visit says it was recorded', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.press(screen.getByLabelText('G열 8번'));
  await user.press(screen.getByLabelText('높이: 딱 좋음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('기록 완료!')).toBeTruthy();
  expect(screen.getByText('G열 8번을 기록했어요')).toBeTruthy();
});

test('my visits in this screen are listed and open the seat detail', async () => {
  const user = userEvent.setup();
  const db = await createTestDb();
  await addVisit(db, { screenId: sillim1.id, seatRow: 'G', seatNumber: 8, visitDate: '2026-11-01', height: 3, side: 3, movie: '위키드' });
  await addVisit(db, { screenId: sillim1.id, seatRow: 'E', seatNumber: 5, visitDate: '2026-10-01', height: 2, side: 3 });
  await renderScreen(db);

  expect(await screen.findByText('이 상영관 내 기록 2개')).toBeTruthy();
  expect(screen.getByRole('button', { name: '내 기록 2개 보기' })).toBeTruthy();
  await user.press(screen.getByRole('button', { name: /^11월 1일, 위키드, G열 8번/ }));

  expect(await screen.findByText('이 좌석에 1번 앉았어요')).toBeTruthy();
});

test('seat lookup starts open and can be folded', async () => {
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  expect(screen.getByLabelText('열')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '좌석 번호로 고르기' }));

  expect(screen.queryByLabelText('열')).toBeNull();
});

test('saving a visit sends an anonymous visit_saved event without the seat or movie', async () => {
  const { track } = jest.requireMock('@/lib/analytics') as { track: jest.Mock };
  const user = userEvent.setup();
  await renderScreen(await createTestDb());
  await screen.findByText(EMPTY);

  await user.press(screen.getByLabelText('G열 8번'));
  await user.type(screen.getByLabelText('영화 제목'), '위키드');
  await user.press(screen.getByLabelText('높이: 딱 좋음'));
  await user.press(screen.getByLabelText('좌우: 딱 좋음'));
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('기록 완료!')).toBeTruthy();
  expect(track).toHaveBeenCalledWith('visit_saved', { chain: '롯데시네마', verdict: 'good', has_movie: true, discomforts: 0 });
});
