import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { SeatGrid } from '@/components/seat-grid';
import { SeatLookup } from '@/components/seat-lookup';
import { Text } from '@/components/text';
import { Toast, type ToastAction } from '@/components/toast';
import { VisitDetail } from '@/components/visit-detail';
import { VisitForm } from '@/components/visit-form';
import { VisitRow } from '@/components/visit-row';
import { seatVerdict, VERDICTS, type Verdict } from '@/constants/ratings';
import { colors, radius, spacing, verdictColors, verdictIcons, verdictInk } from '@/constants/theme';
import { seatKey, type Layout, type Seat } from '@/data/layouts';
import { useDb } from '@/db/db-context';
import { addVisit, deleteVisit, listVisitsByScreen, type Visit } from '@/db/visits';
import { isFailNextSaveArmed, setFailNextSave } from '@/dev/fail-next-save';
import { track } from '@/lib/analytics';
import { formatShortDate, fromIsoDate } from '@/lib/dates';

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
  const [toast, setToast] = useState<{ id: number; title: string; body?: string; action?: ToastAction } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const recordsY = useRef(0);
  const [preview, setPreview] = useState<{ row: string; number: number | null } | null>(null);

  useEffect(() => {
    track('screen_opened', { chain: layout.chain, screen_id: layout.id });
  }, [layout.chain, layout.id]);

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
  const verdicts = new Map<string, Verdict>();
  for (const visit of visits) {
    const key = seatKey(visit.seatRow, visit.seatNumber);
    if (!verdicts.has(key)) verdicts.set(key, seatVerdict(visit));
  }

  const subtitle = `${layout.theater} · ${layout.screen}`;

  function pressSeat(seat: Seat) {
    if (verdicts.has(seatKey(seat.row, seat.number))) {
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

  function showToast(title: string, body?: string, action?: ToastAction) {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, title, body, action }));
  }

  async function removeVisit(visit: Visit) {
    try {
      await deleteVisit(db, visit.id);
    } catch {
      Alert.alert('기록을 지우지 못했어요', '잠시 뒤에 다시 시도해 주세요.');
      return;
    }
    const left = visits.filter(
      (v) => v.id !== visit.id && v.seatRow === visit.seatRow && v.seatNumber === visit.seatNumber,
    );
    if (left.length === 0) {
      closeDetail(false);
    }
    setReloadKey((k) => k + 1);
    showToast('기록을 지웠어요', `${visit.seatRow}열 ${visit.seatNumber}번 · ${formatShortDate(fromIsoDate(visit.visitDate))}`, {
      label: '되돌리기',
      onPress: () => restoreVisit(visit),
    });
  }

  async function restoreVisit(visit: Visit) {
    try {
      await addVisit(db, visit);
    } catch {
      Alert.alert('기록을 되돌리지 못했어요', '잠시 뒤에 다시 시도해 주세요.');
      return;
    }
    setReloadKey((k) => k + 1);
  }

  function retry() {
    setState({ status: 'loading' });
    setReloadKey((k) => k + 1);
  }

  return (
    <View style={styles.screen}>
      <ScrollView ref={scrollRef} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
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
            {state.status === 'ready' && visits.length > 0 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`내 기록 ${visits.length}개 보기`}
                hitSlop={6}
                onPress={() => scrollRef.current?.scrollTo({ y: recordsY.current, animated: true })}>
                <View style={[styles.chipRow, styles.chipAccent]}>
                  <Text style={styles.chipAccentText}>내 기록 {visits.length}개</Text>
                  <Icon name="arrow.down" size={11} color={colors.accent} weight="bold" />
                </View>
              </Pressable>
            )}
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
            <Text style={styles.infoText}>앉았던 좌석을 누르거나 번호로 골라 기록해 보세요.</Text>
          </View>
        )}

        <View style={styles.card}>
          <SeatGrid layout={layout} verdicts={verdicts} highlight={preview} onPressSeat={pressSeat} />
          <View style={styles.legend}>
            <LegendItem label="빈 좌석" />
            {VERDICTS.map((v) => (
              <LegendItem key={v.id} verdict={v.id} label={v.legend} />
            ))}
          </View>
        </View>

        <SeatLookup layout={layout} onSelect={pressSeat} onPreview={setPreview} />

        {visits.length > 0 && (
          <View
            style={styles.records}
            onLayout={(e) => {
              recordsY.current = e.nativeEvent.layout.y;
            }}>
            <Text style={styles.recordsTitle}>이 상영관 내 기록 {visits.length}개</Text>
            {visits.map((visit, i) => (
              <VisitRow
                key={visit.id}
                visit={visit}
                first={i === 0}
                showPlace={false}
                onPress={() => {
                  const seat = layout.seats.find((s) => s.row === visit.seatRow && s.number === visit.seatNumber);
                  if (seat) pressSeat(seat);
                }}
              />
            ))}
          </View>
        )}

        {detailSeat && (
          <VisitDetail
            visible={detailOpen}
            subtitle={subtitle}
            seat={detailSeat}
            visits={visits.filter((v) => v.seatRow === detailSeat.row && v.seatNumber === detailSeat.number)}
            onRecordAgain={() => closeDetail(true)}
            onDelete={removeVisit}
            onClose={() => closeDetail(false)}
            onDismiss={() => finishDetail()}
            overlay={
              toast &&
              detailOpen && (
                <Toast key={toast.id} title={toast.title} body={toast.body} action={toast.action} onHide={hideToast} />
              )
            }
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
              showToast('기록 완료!', `${selectedSeat.row}열 ${selectedSeat.number}번을 기록했어요`);
              setSelectedSeat(null);
              setFailArmed(isFailNextSaveArmed());
              setReloadKey((k) => k + 1);
            }}
          />
        )}
      </ScrollView>
      {toast && !detailOpen && (
        <Toast key={toast.id} title={toast.title} body={toast.body} action={toast.action} onHide={hideToast} />
      )}
    </View>
  );
}

function LegendItem({ verdict, label }: { verdict?: Verdict; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, verdict ? { backgroundColor: verdictColors[verdict], borderWidth: 0 } : null]}>
        {verdict && <Icon name={verdictIcons[verdict]} size={8} color={verdictInk[verdict]} weight="bold" />}
      </View>
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  records: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  recordsTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: spacing.xs },
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
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  chipAccent: { backgroundColor: colors.accentSoft },
  chipAccentText: { fontSize: 13, fontWeight: '700', color: colors.accent },
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
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: {
    width: 14,
    height: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderRadius: 2,
    backgroundColor: colors.seatFill,
    borderWidth: 1,
    borderColor: colors.seatEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: { fontSize: 13, color: colors.muted },
  devText: { color: colors.muted, fontSize: 12, marginTop: spacing.xs },
});
