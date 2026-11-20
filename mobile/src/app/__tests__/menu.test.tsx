import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';

import MenuScreen from '@/app/menu';

test('the guide can be opened again from the menu', async () => {
  const user = userEvent.setup();
  await render(<MenuScreen />);

  expect(screen.getByRole('button', { name: '개인정보 처리 안내' })).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '사용법' }));

  expect(screen.getByText('상영관 찾기')).toBeTruthy();
});

test('usage statistics can be turned off from the menu', async () => {
  const { setAnalyticsOn } = jest.requireMock('@/lib/analytics') as { setAnalyticsOn: jest.Mock };
  await render(<MenuScreen />);

  await fireEvent(screen.getByLabelText('사용 통계 보내기'), 'valueChange', false);

  expect(setAnalyticsOn).toHaveBeenCalledWith(false);
});
