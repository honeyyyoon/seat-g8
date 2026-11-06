import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SeatGrid } from '@/components/seat-grid';
import { VisitDetail } from '@/components/visit-detail';
import { VisitForm } from '@/components/visit-form';
import { colors, radius, spacing } from '@/constants/theme';
import { seatKey, type Layout, type Seat } from '@/data/layouts';
import { useDb } from '@/db/db-context';
import { listVisitsByScreen, type Visit } from '@/db/visits';
import { isFailNextSaveArmed, setFailNextSave } from '@/dev/fail-next-save';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; visits: Visit[] };

export function ScreenView({ layout }: { layout: Layout }) {
  const db = useDb();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [detailSeat, setDetailSeat] = useState<Seat | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [recordAfterDetail, setRecordAfterDetail] = useState(false);
  const [failArmed, setFailArmed] = useState(isFailNextSaveArmed);

  useEffect(() => {
    let cancelled = false;
    listVisitsByScreen(db, layout.id).then(
      (visits) => !cancelled && setState({ status: 'ready', visits }),
      () => !cancelled && setState({ status: 'error' }),
    );
    return () => {
      cancelled = true;
    };
  }, [db, layout.id, reloadKey]);

  const visits = state.status === 'ready' ? state.visits : [];
  const markedSeats = new Set(visits.map((v) => seatKey(v.seatRow, v.seatNumber)));

  const subtitle = `${layout.theater} · ${layout.screen}`;

  function pressSeat(seat: Seat) {
    if (markedSeats.has(seatKey(seat.row, seat.number))) {
      setDetailSeat(seat);
      setDetailOpen(true);
    } else {
      setSelectedSeat(seat);
    }
  }

  function closeDetail(recordAgain: boolean) {
    setRecordAfterDetail(recordAgain);
    setDetailOpen(false);
    if (Platform.OS !== 'ios') {
      finishDetail(recordAgain);
    }
  }

  function finishDetail(recordAgain = recordAfterDetail) {
    if (recordAgain && detailSeat) {
      setSelectedSeat(detailSeat);
    }
    setDetailSeat(null);
    setRecordAfterDetail(false);
  }

  function retry() {
    setState({ status: 'loading' });
    setReloadKey((k) => k + 1);
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.theater}>{layout.theater}</Text>
        <Pressable
          disabled={!__DEV__}
          delayLongPress={1000}
          onLongPress={() => {
            setFailNextSave(!failArmed);
            setFailArmed(!failArmed);
          }}>
          <Text style={styles.title}>{layout.screen}</Text>
        </Pressable>
        <View style={styles.chips}>
          <Text style={styles.chip}>{layout.seatCount}석</Text>
          {state.status === 'ready' && <Text style={[styles.chip, styles.chipAccent]}>내 기록 {visits.length}개</Text>}
        </View>
        {failArmed && <Text style={styles.devText}>개발용: 다음 저장은 실패해요</Text>}
      </View>

      {state.status === 'loading' && (
        <View style={styles.banner}>
          <ActivityIndicator accessibilityLabel="기록을 불러오는 중" color={colors.accent} />
        </View>
      )}
      {state.status === 'error' && (
        <View style={[styles.banner, styles.bannerError]}>
          <Text style={styles.errorText}>지난 기록을 불러오지 못했어요</Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      )}
      {state.status === 'ready' && visits.length === 0 && (
        <View style={[styles.banner, styles.bannerInfo]}>
          <Text style={styles.infoText}>아직 기록이 없어요. 앉았던 좌석을 눌러 기록해 보세요.</Text>
        </View>
      )}

      <View style={styles.card}>
        <SeatGrid layout={layout} markedSeats={markedSeats} onPressSeat={pressSeat} />
        <View style={styles.legend}>
          <LegendItem color={colors.seat} label="빈 좌석" />
          <LegendItem color={colors.accent} label="내가 앉았던 좌석" />
        </View>
      </View>

      {detailSeat && (
        <VisitDetail
          visible={detailOpen}
          subtitle={subtitle}
          seat={detailSeat}
          visits={visits.filter((v) => v.seatRow === detailSeat.row && v.seatNumber === detailSeat.number)}
          onRecordAgain={() => closeDetail(true)}
          onClose={() => closeDetail(false)}
          onDismiss={() => finishDetail()}
        />
      )}

      {selectedSeat && (
        <VisitForm
          screenId={layout.id}
          subtitle={subtitle}
          seat={selectedSeat}
          onCancel={() => {
            setSelectedSeat(null);
            setFailArmed(isFailNextSaveArmed());
          }}
          onSaved={() => {
            setSelectedSeat(null);
            setFailArmed(isFailNextSaveArmed());
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </ScrollView>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  header: { gap: 2, marginBottom: spacing.xs },
  theater: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    overflow: 'hidden',
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  chipAccent: { color: colors.accent, backgroundColor: colors.accentSoft },
  banner: { borderRadius: radius.md, padding: spacing.md, minHeight: 44, justifyContent: 'center' },
  bannerInfo: { backgroundColor: colors.accentSoft },
  infoText: { color: colors.accent, fontSize: 14, lineHeight: 20 },
  bannerError: { backgroundColor: colors.errorSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorText: { color: colors.error, fontSize: 14, flexShrink: 1 },
  retry: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.sm, backgroundColor: colors.surface },
  retryText: { color: colors.error, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderRadius: 2 },
  legendText: { fontSize: 13, color: colors.muted },
  devText: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
});
