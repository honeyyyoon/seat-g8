import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { ScreenView } from '@/components/screen-view';
import { getLayout } from '@/data/layouts';

export default function ScreenRoute() {
  const { screenId } = useLocalSearchParams<{ screenId: string }>();
  const layout = getLayout(screenId);

  if (!layout) {
    return <Text style={{ padding: 16 }}>상영관을 찾지 못했어요</Text>;
  }

  return (
    <>
      <Stack.Screen options={{ title: layout.screen }} />
      <ScreenView layout={layout} />
    </>
  );
}
