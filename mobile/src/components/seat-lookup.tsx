import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text, TextInput } from '@/components/text';
import { colors, radius, spacing } from '@/constants/theme';
import type { Layout, Seat } from '@/data/layouts';

type Props = {
  layout: Layout;
  onSelect: (seat: Seat) => void;
  onPreview?: (preview: { row: string; number: number | null } | null) => void;
};

export function SeatLookup({ layout, onSelect, onPreview }: Props) {
  const [row, setRow] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  const rows = [...new Set([...layout.seats].sort((a, b) => a.y - b.y).map((s) => s.row))];
  const numbers = layout.seats
    .filter((s) => s.row === row)
    .map((s) => s.number)
    .sort((a, b) => a - b);
  const ready = row.length > 0 && number.length > 0;

  useEffect(() => {
    onPreview?.(row ? { row, number: number ? Number(number) : null } : null);
  }, [row, number, onPreview]);

  function changeRow(value: string) {
    setRow(value.replace(/[^a-z]/gi, '').toUpperCase());
    setError(null);
  }

  function changeNumber(value: string) {
    setNumber(value.replace(/\D/g, ''));
    setError(null);
  }

  function select() {
    const seat = layout.seats.find((s) => s.row === row && s.number === Number(number));
    if (!seat) {
      setError(`${row}열 ${number}번은 이 상영관에 없어요`);
      return;
    }
    setError(null);
    onSelect(seat);
  }

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="좌석 번호로 고르기"
        accessibilityState={{ expanded: open }}
        hitSlop={8}
        onPress={() => setOpen(!open)}
        style={styles.header}>
        <Text style={styles.title}>좌석 번호로 고르기</Text>
        <Text style={styles.hint}>{open ? '' : '예: G열 8번'}</Text>
        <Icon name={open ? 'chevron.down' : 'chevron.right'} size={13} color={colors.seatEdge} />
      </Pressable>
      {open && (
        <>
          <View style={styles.fields}>
            <TextInput
              accessibilityLabel="열"
              value={row}
              onChangeText={changeRow}
              maxLength={1}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="G"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />
            <Text style={styles.unit}>열</Text>
            <TextInput
              accessibilityLabel="번"
              value={number}
              onChangeText={changeNumber}
              maxLength={3}
              keyboardType="number-pad"
              placeholder="8"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />
            <Text style={styles.unit}>번</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !ready }}
              disabled={!ready}
              onPress={select}
              style={({ pressed }) => [styles.button, !ready && styles.disabled, pressed && styles.pressed]}>
              <Text style={styles.buttonText}>좌석 선택</Text>
            </Pressable>
          </View>

          <ChipStrip
            items={rows.map((r) => ({ key: r, label: r, name: `${r}열`, selected: r === row }))}
            onPress={(r) => changeRow(r)}
          />
          {numbers.length > 0 && (
            <ChipStrip
              items={numbers.map((n) => ({ key: String(n), label: String(n), name: `${n}번`, selected: String(n) === number }))}
              onPress={(n) => changeNumber(n)}
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </>
      )}
    </View>
  );
}

type Chip = { key: string; label: string; name: string; selected: boolean };

function ChipStrip({ items, onPress }: { items: Chip[]; onPress: (key: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          accessibilityRole="button"
          accessibilityLabel={item.name}
          accessibilityState={{ selected: item.selected }}
          hitSlop={{ top: 4, bottom: 4 }}
          onPress={() => onPress(item.key)}
          style={[styles.chip, item.selected && styles.chipSelected]}>
          <Text style={[styles.chipText, item.selected && styles.chipTextSelected]}>{item.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  hint: { flex: 1, textAlign: 'right', fontSize: 14, color: colors.muted },
  fields: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  input: {
    width: 52,
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  unit: { fontSize: 16, color: colors.ink, marginRight: spacing.sm },
  button: {
    marginLeft: 'auto',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.85 },
  buttonText: { color: colors.onAccent, fontSize: 15, fontWeight: '700' },
  strip: { gap: 6 },
  chip: {
    minWidth: 36,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  chipSelected: { backgroundColor: colors.accent },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.ink },
  chipTextSelected: { color: colors.onAccent },
  error: { color: colors.error, fontSize: 14 },
});
