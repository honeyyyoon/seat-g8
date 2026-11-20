import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FONTS } from '@/components/text';
import { colors } from '@/constants/theme';
import { DbProvider } from '@/db/db-context';
import { migrate } from '@/db/migrate';

function WithDb({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return <DbProvider db={db}>{children}</DbProvider>;
}

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 300 });

const SPLASH_MIN_MS = 1000;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const ready = fontsLoaded || fontError !== null;
  const [minShown, setMinShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinShown(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && minShown) SplashScreen.hideAsync().catch(() => {});
  }, [ready, minShown]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="seat-g8.db" onInit={migrate}>
        <WithDb>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
              headerTintColor: colors.accent,
              headerTitleStyle: { color: colors.ink, fontFamily: 'Pretendard-Bold' },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.bg },
            }}>
            <Stack.Screen name="index" options={{ title: 'G열 8번', headerShown: false }} />
            <Stack.Screen name="screens/[screenId]" options={{ title: '' }} />
            <Stack.Screen name="visits" options={{ title: '내 기록' }} />
            <Stack.Screen name="menu" options={{ title: '메뉴' }} />
            <Stack.Screen name="privacy" options={{ title: '개인정보 처리 안내' }} />
            <Stack.Screen name="map" options={{ title: '극장 지도' }} />
            <Stack.Screen name="chains/[chain]" options={{ title: '' }} />
            <Stack.Screen name="theaters/[theaterId]" options={{ title: '' }} />
          </Stack>
        </WithDb>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
