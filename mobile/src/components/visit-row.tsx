import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { HEIGHT_LABELS, seatVerdict, SIDE_LABELS, verdictLabel } from '@/constants/ratings';
import { colors, spacing, verdictColors, verdictIcons, verdictInk, verdictText } from '@/constants/theme';
import { getScreen } from '@/data/layouts';
import type { Visit } from '@/db/visits';
import { formatShortDate, fromIsoDate } from '@/lib/dates';

type Props = { visit: Visit; first?: boolean; showPlace?: boolean; onPress?: () => void };

export function VisitRow({ visit, first = false, showPlace = true, onPress }: Props) {
  const layout = getScreen(visit.screenId);
  const verdict = seatVerdict(visit);
  const place = layout ? `${layout.theater} · ${layout.screen}` : '없어진 상영관';
  const seat = `${visit.seatRow}열 ${visit.seatNumber}번`;
  const date = formatShortDate(fromIsoDate(visit.visitDate));
  const ratings = `높이 ${HEIGHT_LABELS[visit.height - 1]} · 좌우 ${SIDE_LABELS[visit.side - 1]}`;
  const detail = showPlace ? place : ratings;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'link'}
      accessibilityLabel={[date, visit.movie, showPlace && place, seat, verdictLabel(verdict)].filter(Boolean).join(', ')}
      disabled={!layout}
      onPress={onPress ?? (() => router.push({ pathname: '/screens/[screenId]', params: { screenId: visit.screenId } }))}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}>
      <View style={[styles.seat, { backgroundColor: verdictColors[verdict] }]}>
        <Icon name={verdictIcons[verdict]} size={11} color={verdictInk[verdict]} weight="bold" />
      </View>
      <View style={styles.text}>
        <Text style={styles.seatText} numberOfLines={1}>
          {visit.movie ?? seat}
        </Text>
        <Text style={styles.place} numberOfLines={1}>
          {visit.movie ? `${seat} · ${detail}` : detail}
        </Text>
      </View>
      <View style={styles.side}>
        <Text style={styles.date}>{date}</Text>
        <Text style={[styles.verdict, { color: verdictText[verdict] }]}>{verdictLabel(verdict)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { opacity: 0.6 },
  seat: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  seatText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  place: { fontSize: 13, color: colors.muted },
  side: { alignItems: 'flex-end', gap: 2 },
  date: { fontSize: 13, color: colors.muted },
  verdict: { fontSize: 13, fontWeight: '700' },
});
