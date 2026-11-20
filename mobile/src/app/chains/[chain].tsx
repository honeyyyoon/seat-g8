import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { TheaterRow } from '@/components/theater-row';
import { colors, radius, spacing } from '@/constants/theme';
import { listTheaters } from '@/data/layouts';

export default function ChainScreen() {
  const { chain } = useLocalSearchParams<{ chain: string }>();
  const theaters = listTheaters().filter((t) => t.chain === chain);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: chain }} />
      <Text style={styles.summary}>극장 {theaters.length}곳</Text>
      <View style={styles.card}>
        {theaters.map((theater, i) => (
          <TheaterRow key={theater.id} theater={theater} detail={`상영관 ${theater.screens.length}개`} first={i === 0} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
  summary: { fontSize: 13, fontWeight: '700', color: colors.muted, marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingLeft: spacing.lg },
});
