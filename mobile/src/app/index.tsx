import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { chainColors, colors, radius, spacing } from '@/constants/theme';
import { listChains, type Chain, type Theater } from '@/data/layouts';

const chains = listChains();

export default function HomeScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="never" contentContainerStyle={styles.content}>
      <Hero />
      <View style={styles.list}>
        <Text style={styles.sectionLabel}>기록할 상영관을 골라요</Text>
        {chains.map((chain) => (
          <ChainCard key={chain.name} chain={chain} />
        ))}
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

function ChainCard({ chain }: { chain: Chain }) {
  const color = chainColors[chain.name] ?? colors.accent;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.chainMark, { backgroundColor: color }]} />
        <Text style={styles.chainName}>{chain.name}</Text>
      </View>
      {chain.theaters.map((theater) => (
        <TheaterGroup key={theater.name} chain={chain.name} theater={theater} color={color} />
      ))}
    </View>
  );
}

function TheaterGroup({ chain, theater, color }: { chain: string; theater: Theater; color: string }) {
  const [open, setOpen] = useState(false);
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
