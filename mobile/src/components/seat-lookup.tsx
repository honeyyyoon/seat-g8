import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { Layout, Seat } from '@/data/layouts';

type Props = {
  layout: Layout;
  onSelect: (seat: Seat) => void;
};

export function SeatLookup({ layout, onSelect }: Props) {
  const [row, setRow] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const rows = [...new Set([...layout.seats].sort((a, b) => a.y - b.y).map((s) => s.row))];
  const numbers = layout.seats
    .filter((s) => s.row === row)
    .map((s) => s.number)
    .sort((a, b) => a - b);
  const ready = row.length > 0 && number.length > 0;

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
      <Text style={styles.title}>좌석 번호로 고르기</Text>
      <View style={styles.fields}>
        <TextInput
          accessibilityLabel="열"
          value={row}
          onChangeText={changeRow}
          maxLength={1}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="G"
          placeholderTextColor={colors.seat}
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
          placeholderTextColor={colors.seat}
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
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
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
