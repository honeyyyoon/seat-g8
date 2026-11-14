import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

test('searching opens the matching theater and shows its screens', async () => {
  const user = userEvent.setup();
  await render(<HomeScreen />);

  await user.type(screen.getByLabelText('극장·상영관 검색'), '코엑스 돌비');

  expect(screen.getByText('검색 결과 1개')).toBeTruthy();
  expect(screen.getByText('DOLBY CINEMA')).toBeTruthy();
  expect(screen.queryByText('신림')).toBeNull();
});

test('a search with no match says so and can be cleared', async () => {
  const user = userEvent.setup();
  await render(<HomeScreen />);

  await user.type(screen.getByLabelText('극장·상영관 검색'), '부산');
  expect(screen.getByText('‘부산’에 맞는 상영관이 없어요')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: '검색 지우기' }));
  expect(screen.getByText('극장 20곳 · 상영관 180개')).toBeTruthy();
  expect(screen.getByText('신림')).toBeTruthy();
});
