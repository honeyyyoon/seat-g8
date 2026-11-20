import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { VisitRow } from '@/components/visit-row';
import { chainText, colors, radius, spacing } from '@/constants/theme';
import { listTheaters } from '@/data/layouts';
import { useDb } from '@/db/db-context';
import { listAllVisits, type Visit } from '@/db/visits';

export default function TheaterScreen() {
  const { theaterId } = useLocalSearchParams<{ theaterId: string }>();
  const theater = listTheaters().find((t) => t.id === theaterId);
  const db = useDb();
  const [visits, setVisits] = useState<Visit[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listAllVisits(db).then(
        (all) => !cancelled && setVisits(all),
        () => {},
      );
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  if (!theater) {
    return <Text style={{ padding: 16 }}>극장을 찾지 못했어요</Text>;
  }

  const ids = new Set(theater.screens.map((s) => s.id));
  const mine = visits.filter((v) => ids.has(v.screenId));
  const countByScreen = new Map<string, number>();
  for (const visit of mine) countByScreen.set(visit.screenId, (countByScreen.get(visit.screenId) ?? 0) + 1);
  const color = chainText[theater.chain] ?? colors.accent;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: theater.name.replace(theater.chain, '').trim() }} />
      <View style={styles.header}>
        <Text style={[styles.chain, { color }]}>{theater.chain}</Text>
        <Text style={styles.title}>{theater.name.replace(theater.chain, '').trim()}</Text>
        <Text style={styles.meta}>
          상영관 {theater.screens.length}개{mine.length > 0 ? ` · 내 기록 ${mine.length}개` : ''}
        </Text>
      </View>

      {mine.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 기록</Text>
          <View style={styles.card}>
            {mine.map((visit, i) => (
              <VisitRow key={visit.id} visit={visit} first={i === 0} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>상영관</Text>
        <View style={styles.card}>
          {theater.screens.map((screen, i) => {
            const count = countByScreen.get(screen.id) ?? 0;
            return (
              <Pressable
                key={screen.id}
                accessibilityRole="link"
                accessibilityLabel={`${screen.screen}, ${screen.seatCount}석${count ? `, 내 기록 ${count}개` : ''}`}
                onPress={() => router.push({ pathname: '/screens/[screenId]', params: { screenId: screen.id } })}
                style={({ pressed }) => [styles.screenRow, i > 0 && styles.divider, pressed && styles.pressed]}>
                <Text style={styles.screenName} numberOfLines={1}>
                  {screen.screen}
                </Text>
                {count > 0 && <Text style={styles.badge}>기록 {count}</Text>}
                <Text style={styles.seats}>{screen.seatCount}석</Text>
                <View style={styles.chevron}>
                  <Icon name="chevron.right" size={13} color={colors.seatEdge} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  header: { gap: 2 },
  chain: { fontSize: 14, fontWeight: '800' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginTop: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  screenRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { opacity: 0.6 },
  screenName: { flex: 1, fontSize: 16, color: colors.ink },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
    marginLeft: spacing.sm,
  },
  seats: { fontSize: 14, color: colors.muted, marginLeft: spacing.md },
  chevron: { width: 16, alignItems: 'center', marginLeft: spacing.sm },
});
