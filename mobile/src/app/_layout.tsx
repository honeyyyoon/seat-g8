import { Stack } from 'expo-router';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/theme';
import { DbProvider } from '@/db/db-context';
import { migrate } from '@/db/migrate';

function WithDb({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  return <DbProvider db={db}>{children}</DbProvider>;
}

export default function RootLayout() {
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
              headerTitleStyle: { color: colors.ink, fontWeight: '700' },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.bg },
            }}>
            <Stack.Screen name="index" options={{ title: 'G열 8번', headerShown: false }} />
            <Stack.Screen name="screens/[screenId]" options={{ title: '' }} />
          </Stack>
        </WithDb>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
