import { expect, test } from '@jest/globals';
import { render, screen, userEvent } from '@testing-library/react-native';

import MenuScreen from '@/app/menu';

test('the guide can be opened again from the menu', async () => {
  const user = userEvent.setup();
  await render(<MenuScreen />);

  expect(screen.getByRole('button', { name: '개인정보 처리 안내' })).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '사용법' }));

  expect(screen.getByText('상영관 찾기')).toBeTruthy();
});
