import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chainColors, colors, radius, spacing } from '@/constants/theme';
import { listChains, type Chain, type Theater } from '@/data/layouts';

function screenCount(chains: Chain[]) {
  return chains.reduce((sum, chain) => sum + chain.screenCount, 0);
}

export default function HomeScreen() {
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const chains = listChains(query);
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      <Hero />
      <View style={styles.list}>
        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
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
        <Text style={styles.sectionLabel}>
          {searching
            ? `검색 결과 ${screenCount(chains)}개`
            : `극장 ${chains.reduce((sum, chain) => sum + chain.theaters.length, 0)}곳 · 상영관 ${screenCount(chains)}개`}
        </Text>
        {chains.map((chain) => (
          <ChainCard key={chain.name} chain={chain} searching={searching} />
        ))}
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

function Hero() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
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

function ChainCard({ chain, searching }: { chain: Chain; searching: boolean }) {
  const color = chainColors[chain.name] ?? colors.accent;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.chainMark, { backgroundColor: color }]} />
        <Text style={styles.chainName}>{chain.name}</Text>
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
        <Text style={[styles.chevron, open && styles.chevronOpen]}>›</Text>
      </Pressable>
      {open &&
        theater.screens.map((screen) => (
          <Pressable
            key={screen.id}
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/screens/[screenId]', params: { screenId: screen.id } })}
            style={({ pressed }) => [styles.screenRow, pressed && styles.pressed]}>
            <View style={[styles.screenLine, { backgroundColor: color }]} />
            <Text style={styles.screenName} numberOfLines={1}>
              {screen.screen}
            </Text>
            <Text style={styles.meta}>{screen.seatCount}석</Text>
            <Text style={styles.screenChevron}>›</Text>
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
  motif: { marginBottom: spacing.md },
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: { fontSize: 20, color: colors.muted, marginRight: spacing.xs },
  searchInput: { flex: 1, fontSize: 16, color: colors.ink, paddingVertical: 12 },
  empty: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  emptyBody: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  emptyButton: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingVertical: 6 },
  emptyButtonText: { fontSize: 15, fontWeight: '700', color: colors.accent },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: spacing.sm, marginLeft: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  chainMark: { width: 4, height: 22, borderRadius: 2, marginRight: spacing.sm },
  chainName: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.ink },
  group: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, marginLeft: spacing.lg },
  theaterRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.lg, paddingVertical: 15 },
  theaterName: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginLeft: spacing.md },
  chevron: { width: 16, textAlign: 'center', fontSize: 22, color: colors.muted, marginLeft: spacing.sm, marginTop: -2 },
  chevronOpen: { transform: [{ rotate: '90deg' }] },
  pressed: { opacity: 0.6 },
  screenRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.lg, paddingVertical: 12, paddingLeft: spacing.xs },
  screenLine: { width: 2, alignSelf: 'stretch', borderRadius: 1, marginRight: spacing.md, opacity: 0.5 },
  screenName: { flex: 1, fontSize: 15, color: colors.ink },
  screenChevron: { width: 16, textAlign: 'center', fontSize: 18, color: colors.seat, marginLeft: spacing.sm },
});
