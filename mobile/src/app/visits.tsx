import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { VisitRow } from '@/components/visit-row';
import { colors, radius, spacing } from '@/constants/theme';
import { useDb } from '@/db/db-context';
import { listAllVisits, type Visit } from '@/db/visits';
import { formatMonth, fromIsoDate } from '@/lib/dates';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; visits: Visit[] };

export default function VisitsScreen() {
  const db = useDb();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      listAllVisits(db).then(
        (visits) => !cancelled && setState({ status: 'ready', visits }),
        () => !cancelled && setState({ status: 'error' }),
      );
      return () => {
        cancelled = true;
      };
    }, [db, reloadKey]),
  );

  if (state.status === 'loading') {
    return <ActivityIndicator accessibilityLabel="기록을 불러오는 중" color={colors.accent} style={styles.loading} />;
  }

  if (state.status === 'error') {
    return (
      <View style={styles.content}>
        <View style={[styles.card, styles.errorCard]}>
          <Text style={styles.errorText}>기록을 불러오지 못했어요</Text>
          <Pressable accessibilityRole="button" onPress={() => setReloadKey((k) => k + 1)}>
            <Text style={styles.retry}>다시 시도</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { visits } = state;
  if (visits.length === 0) {
    return (
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.emptyTitle}>아직 기록이 없어요</Text>
          <Text style={styles.emptyBody}>상영관에 들어가 앉았던 좌석을 누르면 여기에 모여요.</Text>
        </View>
      </View>
    );
  }

  const months = new Map<string, Visit[]>();
  for (const visit of visits) {
    const month = formatMonth(fromIsoDate(visit.visitDate));
    months.set(month, [...(months.get(month) ?? []), visit]);
  }
  const screenCount = new Set(visits.map((v) => v.screenId)).size;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text style={styles.summary}>
        기록 {visits.length}개 · 상영관 {screenCount}곳
      </Text>
      {[...months].map(([month, items]) => (
        <View key={month} style={styles.section}>
          <Text style={styles.month}>{month}</Text>
          <View style={styles.card}>
            {items.map((visit, i) => (
              <VisitRow key={visit.id} visit={visit} first={i === 0} />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xl * 2 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  summary: { fontSize: 13, fontWeight: '700', color: colors.muted, marginLeft: spacing.xs },
  section: { gap: spacing.sm },
  month: { fontSize: 15, fontWeight: '800', color: colors.ink, marginLeft: spacing.xs, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: spacing.md },
  emptyBody: { fontSize: 14, color: colors.muted, lineHeight: 20, marginVertical: spacing.sm },
  errorCard: { backgroundColor: colors.errorSoft, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  errorText: { color: colors.error, fontSize: 14 },
  retry: { color: colors.error, fontWeight: '700' },
});
