import { expect, jest, test } from '@jest/globals';
import { render, screen, userEvent, within } from '@testing-library/react-native';
import { router } from 'expo-router';

import MapScreen from '@/app/map';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: async () => ({ granted: false }),
  getLastKnownPositionAsync: async () => null,
  getCurrentPositionAsync: async () => null,
  Accuracy: { Balanced: 3 },
}));
jest.mock('react-native-maps', () => {
  const { Pressable, View } = require('react-native');
  const MapView = ({ children }: { children: unknown }) => <View>{children as never}</View>;
  const { Text } = require('react-native');
  const Marker = ({ testID, title, description, onCalloutPress }: Record<string, never>) => (
    <View testID={testID}>
      <Text>{title}</Text>
      <Pressable accessibilityRole="button" onPress={onCalloutPress}>
        <Text>{description}</Text>
      </Pressable>
    </View>
  );
  return { __esModule: true, default: MapView, Marker };
});

test('a theater on the map opens from its 자세히 보기 callout', async () => {
  const user = userEvent.setup();
  const push = jest.spyOn(router, 'push').mockImplementation(() => {});
  await render(<MapScreen />);

  const marker = within(screen.getByTestId('marker-lotte-1012'));
  expect(marker.getByText('롯데시네마 서울대입구')).toBeTruthy();
  await user.press(marker.getByText('자세히 보기 ›'));

  expect(push).toHaveBeenCalledWith({ pathname: '/theaters/[theaterId]', params: { theaterId: 'lotte-1012' } });
});
