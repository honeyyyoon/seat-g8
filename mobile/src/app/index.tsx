import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Onboarding } from '@/components/onboarding';
import { Text, TextInput } from '@/components/text';
import { TheaterRow } from '@/components/theater-row';
import { VisitRow } from '@/components/visit-row';
import { chainText, colors, radius, spacing } from '@/constants/theme';
import { distanceKm, listChains, searchTheaters, type Chain, type Theater } from '@/data/layouts';
import { useDb } from '@/db/db-context';
import { getPref, setPref } from '@/db/prefs';
import { listAllVisits, type Visit } from '@/db/visits';
import { formatDistance, hasLocationPermission, useCurrentLocation, type Coords } from '@/lib/location';

const ONBOARDING_KEY = 'onboarding_done';
const RECENT_KEY = 'recent_collapsed';
const NEARBY_PAGE = 8;

function screenCount(chains: Chain[]) {
  return chains.reduce((sum, chain) => sum + chain.screenCount, 0);
}

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const chains = listChains(query);
  const db = useDb();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [recentCollapsed, setRecentCollapsed] = useState(false);
  const location = useCurrentLocation();
  const here = location.state.status === 'ready' ? location.state.coords : null;
  const showNearby = nearby && here !== null;

  function chooseNearby(on: boolean) {
    setNearby(on);
    if (on && location.state.status !== 'ready' && location.state.status !== 'asking') {
      location.request();
    }
  }

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

  useEffect(() => {
    getPref(db, ONBOARDING_KEY).then(
      (done) => !done && setGuideOpen(true),
      () => {},
    );
    hasLocationPermission().then(
      (granted) => granted && chooseNearby(true),
      () => {},
    );
    getPref(db, RECENT_KEY).then(
      (value) => setRecentCollapsed(value === '1'),
      () => {},
    );
  }, [db]);

  function toggleRecent() {
    const next = !recentCollapsed;
    setRecentCollapsed(next);
    setPref(db, RECENT_KEY, next ? '1' : '0').catch(() => {});
  }

  function closeGuide() {
    setGuideOpen(false);
    setPref(db, ONBOARDING_KEY, '1').catch(() => {});
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <Hero onOpenMenu={() => router.push('/menu')} />
      <Onboarding visible={guideOpen} onDone={closeGuide} />
      <View style={styles.list}>
        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Icon name="magnifyingglass" size={17} color={colors.muted} />
            <TextInput
              accessibilityLabel="극장·상영관 검색"
              value={query}
              onChangeText={setQuery}
              placeholder="극장·상영관 검색 (신림, IMAX)"
              placeholderTextColor={colors.muted}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              style={styles.searchInput}
            />
          </View>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="지도에서 극장 찾기"
            onPress={() => router.push('/map')}
            style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}>
            <Icon name="map" size={20} color={colors.accent} />
          </Pressable>
        </View>
        {!searching && visits.length > 0 && (
          <RecentVisits visits={visits} collapsed={recentCollapsed} onToggle={toggleRecent} />
        )}
        <View style={styles.sortRow}>
          <Text style={[styles.sectionLabel, styles.sortLabel]}>
            {searching
              ? `검색 결과 ${screenCount(chains)}개`
              : `극장 ${chains.reduce((sum, chain) => sum + chain.theaters.length, 0)}곳 · 상영관 ${screenCount(chains)}개`}
          </Text>
          <View style={styles.segment}>
            <SortButton label="체인별" selected={!nearby} onPress={() => chooseNearby(false)} />
            <SortButton label="가까운 순" selected={nearby} onPress={() => chooseNearby(true)} />
          </View>
        </View>
        {nearby && location.state.status === 'asking' && <Text style={styles.notice}>위치를 확인하고 있어요…</Text>}
        {nearby && location.state.status === 'denied' && (
          <Text style={styles.notice}>위치 권한이 꺼져 있어요. 설정 앱에서 켜면 가까운 순으로 볼 수 있어요.</Text>
        )}
        {nearby && location.state.status === 'error' && <Text style={styles.notice}>위치를 확인하지 못했어요.</Text>}
        {showNearby && <NearbyCard key={query} theaters={searchTheaters(query)} here={here} />}
        {!showNearby && !searching && <ChainList chains={chains} />}
        {!showNearby && searching && chains.map((chain) => <ChainCard key={chain.name} chain={chain} searching />)}
        {searching && chains.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>‘{query.trim()}’에 맞는 상영관이 없어요</Text>
            <Text style={styles.emptyBody}>극장 이름(신림, 코엑스)이나 상영관(IMAX, 4DX)으로 찾아보세요.</Text>
            <Pressable accessibilityRole="button" onPress={() => setQuery('')} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>검색 지우기</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SortButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={onPress}
      style={[styles.sortButton, selected && styles.sortButtonOn]}>
      <Text style={[styles.sortText, selected && styles.sortTextOn]}>{label}</Text>
    </Pressable>
  );
}

function NearbyCard({ theaters, here }: { theaters: Theater[]; here: Coords }) {
  const [shown, setShown] = useState(NEARBY_PAGE);
  const sorted = theaters
    .filter((t) => t.lat !== null && t.lng !== null)
    .map((t) => ({ theater: t, km: distanceKm(here, { lat: t.lat!, lng: t.lng! }) }))
    .sort((a, b) => a.km - b.km);
  const rest = sorted.length - shown;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.chainName}>가까운 극장</Text>
      </View>
      <View style={styles.rows}>
        {sorted.slice(0, shown).map(({ theater, km }, i) => (
          <TheaterRow key={theater.id} theater={theater} detail={formatDistance(km)} showChain first={i === 0} />
        ))}
      </View>
      {rest > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="더보기"
          onPress={() => setShown(shown + 10)}
          style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
          <Text style={styles.moreText}>더보기</Text>
          <Icon name="chevron.down" size={13} color={colors.accent} />
        </Pressable>
      )}
    </View>
  );
}

function ChainList({ chains }: { chains: Chain[] }) {
  return (
    <View style={[styles.card, styles.rows]}>
      {chains.map((chain, i) => {
        const color = chainText[chain.name] ?? colors.accent;
        return (
          <Pressable
            key={chain.name}
            accessibilityRole="link"
            accessibilityLabel={`${chain.name}, 극장 ${chain.theaters.length}곳`}
            onPress={() => router.push({ pathname: '/chains/[chain]', params: { chain: chain.name } })}
            style={({ pressed }) => [styles.chainRow, i > 0 && styles.chainDivider, pressed && styles.pressed]}>
            <Text style={[styles.chainName, { color }]}>{chain.name}</Text>
            <Text style={styles.meta}>극장 {chain.theaters.length}곳</Text>
            <Chevron />
          </Pressable>
        );
      })}
    </View>
  );
}

function RecentVisits({ visits, collapsed, onToggle }: { visits: Visit[]; collapsed: boolean; onToggle: () => void }) {
  return (
    <View style={[styles.recent, collapsed && styles.recentCollapsed]}>
      <View style={styles.recentHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="최근 기록"
          accessibilityState={{ expanded: !collapsed }}
          hitSlop={8}
          onPress={onToggle}
          style={styles.recentToggle}>
          <Text style={styles.recentTitle}>최근 기록</Text>
          <Icon name={collapsed ? 'chevron.right' : 'chevron.down'} size={13} color={colors.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`전체 기록 ${visits.length}개`}
          hitSlop={10}
          onPress={() => router.push('/visits')}
          style={styles.recentAllRow}>
          <Text style={styles.recentAll}>전체 {visits.length}개</Text>
          <Icon name="chevron.right" size={12} color={colors.accent} />
        </Pressable>
      </View>
      {!collapsed &&
        visits.slice(0, 3).map((visit, i) => <VisitRow key={visit.id} visit={visit} first={i === 0} />)}
    </View>
  );
}

function Hero({ onOpenMenu }: { onOpenMenu: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="메뉴"
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.guideButton, { top: insets.top }, pressed && styles.pressed]}>
        <Icon name="line.3.horizontal" size={20} color={colors.accent} />
      </Pressable>
      <View style={styles.motif} accessible={false}>
        <View style={styles.motifScreen} />
        <View style={styles.motifRow}>
          <Text style={styles.motifLetter}>G</Text>
          {Array.from({ length: 10 }, (_, i) => (
            <View key={i} style={[styles.motifSeat, i === 7 && styles.motifSeatOn]} />
          ))}
          <View style={styles.motifLetter} />
        </View>
      </View>
      <Text style={styles.heroTitle}>G열 8번</Text>
    </View>
  );
}

function Chevron() {
  return (
    <View style={styles.chevron}>
      <Icon name="chevron.right" size={13} color={colors.seatEdge} />
    </View>
  );
}

function ChainCard({ chain, searching }: { chain: Chain; searching: boolean }) {
  const color = chainText[chain.name] ?? colors.accent;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.chainName, { color }]}>{chain.name}</Text>
      </View>
      {chain.theaters.map((theater) => (
        <TheaterGroup
          key={`${theater.name}-${searching}`}
          chain={chain.name}
          theater={theater}
          color={color}
          initiallyOpen={searching}
        />
      ))}
    </View>
  );
}

type TheaterGroupProps = { chain: string; theater: Theater; color: string; initiallyOpen: boolean };

function TheaterGroup({ chain, theater, color, initiallyOpen }: TheaterGroupProps) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View style={styles.group}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [styles.theaterRow, pressed && styles.pressed]}>
        <Text style={[styles.theaterName, open && { color }]}>{theater.name.replace(chain, '').trim()}</Text>
        <Text style={styles.meta}>상영관 {theater.screens.length}개</Text>
        <View style={styles.chevron}>
          <Icon name={open ? 'chevron.down' : 'chevron.right'} size={13} color={colors.seatEdge} />
        </View>
      </Pressable>
      {open &&
        theater.screens.map((screen) => (
          <Pressable
            key={screen.id}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/screens/[screenId]', params: { screenId: screen.id } })}
            style={({ pressed }) => [styles.screenRow, pressed && styles.pressed]}>
            <Text style={styles.screenName} numberOfLines={1}>
              {screen.screen}
            </Text>
            <Text style={styles.meta}>{screen.seatCount}석</Text>
            <Chevron />
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xl * 2 },
  hero: {
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  motif: { marginBottom: spacing.md, marginTop: spacing.lg },
  guideButton: {
    position: 'absolute',
    right: spacing.sm,
    zIndex: 1,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recent: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs },
  recentCollapsed: { paddingBottom: spacing.lg },
  recentToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  recentAllRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rows: { paddingLeft: spacing.lg },
  chainRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingRight: spacing.lg },
  chainDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  more: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  moreText: { fontSize: 15, fontWeight: '700', color: colors.accent },
  recentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  recentTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  recentAll: { fontSize: 14, fontWeight: '700', color: colors.accent },
  motifScreen: {
    height: 4,
    marginHorizontal: 22,
    marginBottom: 12,
    backgroundColor: colors.accent,
    opacity: 0.3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  motifRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  motifLetter: { width: 16, fontSize: 12, fontWeight: '800', color: colors.accent },
  motifSeat: { width: 16, height: 16, borderRadius: 3, borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: colors.surface },
  motifSeatOn: { backgroundColor: colors.accent },
  heroTitle: { fontSize: 40, fontWeight: '900', color: colors.accent, letterSpacing: -1 },
  list: { padding: spacing.lg, gap: spacing.md },
  searchRow: { flexDirection: 'row', gap: spacing.sm },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 13 },
  mapButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  empty: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptyBody: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  emptyButton: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingVertical: 6 },
  emptyButtonText: { fontSize: 15, fontWeight: '700', color: colors.accent },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  sortLabel: { flex: 1, marginTop: 0 },
  segment: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: radius.md, padding: 3 },
  sortButton: { borderRadius: radius.md - 3, paddingHorizontal: 12, paddingVertical: 7 },
  sortButtonOn: { backgroundColor: colors.surface },
  sortText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  sortTextOn: { color: colors.ink, fontWeight: '700' },
  notice: { fontSize: 14, color: colors.muted, marginLeft: spacing.xs, lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: spacing.sm, marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  chainName: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.ink },
  group: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginLeft: spacing.lg },
  theaterRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.lg, paddingVertical: 15 },
  theaterName: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginLeft: spacing.md },
  chevron: { width: 16, alignItems: 'center', marginLeft: spacing.sm },
  pressed: { opacity: 0.6 },
  screenRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.lg, paddingVertical: 13, paddingLeft: spacing.md },
  screenName: { flex: 1, fontSize: 15, color: colors.ink },
});
