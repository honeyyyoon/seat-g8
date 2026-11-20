import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { chainText, colors, spacing } from '@/constants/theme';
import type { Theater } from '@/data/layouts';

type Props = { theater: Theater; detail: string; showChain?: boolean; first?: boolean };

export function TheaterRow({ theater, detail, showChain = false, first = false }: Props) {
  const color = chainText[theater.chain] ?? colors.accent;
  const name = theater.name.replace(theater.chain, '').trim();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${theater.name}, ${detail}`}
      onPress={() => router.push({ pathname: '/theaters/[theaterId]', params: { theaterId: theater.id } })}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}>
      {showChain && <Text style={[styles.chain, { color }]}>{theater.chain === '롯데시네마' ? '롯데' : theater.chain}</Text>}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.detail}>{detail}</Text>
      <View style={styles.chevron}>
        <Icon name="chevron.right" size={13} color={colors.seatEdge} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingRight: spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { opacity: 0.6 },
  chain: { width: 52, fontSize: 13, fontWeight: '800' },
  name: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.ink },
  detail: { fontSize: 14, color: colors.muted, marginLeft: spacing.md },
  chevron: { width: 16, alignItems: 'center', marginLeft: spacing.sm },
});
