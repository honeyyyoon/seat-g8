import { expect, test } from '@jest/globals';
import { render, screen, userEvent, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SeatGrid } from '@/components/seat-grid';
import { getLayout } from '@/data/layouts';

const imax = getLayout('cgv-0059-017')!;

function seatWidth() {
  return StyleSheet.flatten(screen.getByLabelText('G열 8번').props.style).width as number;
}

test('a big screen can be zoomed in until seat numbers show, and back out', async () => {
  const user = userEvent.setup();
  await render(
    <GestureHandlerRootView>
      <SeatGrid layout={imax} markedSeats={new Set()} onPressSeat={() => {}} />
    </GestureHandlerRootView>,
  );
  const start = seatWidth();
  expect(screen.getByRole('button', { name: '좌석표 축소', disabled: true })).toBeTruthy();

  await user.press(screen.getByRole('button', { name: '좌석표 확대' }));
  await user.press(screen.getByRole('button', { name: '좌석표 확대' }));

  expect(seatWidth()).toBeGreaterThan(start * 2);
  expect(screen.getByRole('button', { name: '좌석표 확대', disabled: true })).toBeTruthy();
  expect(within(screen.getByLabelText('G열 8번')).getByText('8')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: '좌석표 축소' }));
  await user.press(screen.getByRole('button', { name: '좌석표 축소' }));
  expect(seatWidth()).toBe(start);
});
