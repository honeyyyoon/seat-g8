import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DISCOMFORTS, HEIGHT_LABELS, SIDE_LABELS, type Discomfort } from '@/constants/ratings';
import { colors, radius, spacing } from '@/constants/theme';
import type { Seat } from '@/data/layouts';
import { useDb } from '@/db/db-context';
import { addVisit, type Rating } from '@/db/visits';
import { takeFailNextSave } from '@/dev/fail-next-save';
import { formatKoreanDate, toIsoDate } from '@/lib/dates';

type Props = {
  screenId: string;
  subtitle: string;
  seat: Seat;
  onSaved: () => void;
  onCancel: () => void;
};

export function VisitForm({ screenId, subtitle, seat, onSaved, onCancel }: Props) {
  const db = useDb();
  const [visitDate, setVisitDate] = useState(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [height, setHeight] = useState<Rating | null>(null);
  const [side, setSide] = useState<Rating | null>(null);
  const [discomforts, setDiscomforts] = useState<Discomfort[]>([]);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const canSave = !saving && height !== null && side !== null;

  function openCalendar() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: visitDate,
        mode: 'date',
        maximumDate: new Date(),
        onValueChange: (_, date) => setVisitDate(date),
      });
      return;
    }
    setCalendarOpen((open) => !open);
  }

  function toggleDiscomfort(id: Discomfort) {
    setDiscomforts((current) => (current.includes(id) ? current.filter((d) => d !== id) : [...current, id]));
  }

  async function save() {
    if (height === null || side === null) return;
    setSaving(true);
    try {
      if (__DEV__ && takeFailNextSave()) {
        throw new Error('forced failure');
      }
      await addVisit(db, { screenId, seatRow: seat.row, seatNumber: seat.number, visitDate: toIsoDate(visitDate), height, side, discomforts });
      onSaved();
    } catch {
      setFailed(true);
      setSaving(false);
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.title}>
            {seat.row}열 {seat.number}번
          </Text>

          <View style={styles.section}>
            <View style={styles.dateRow}>
              <Text style={styles.label}>날짜</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`날짜, ${formatKoreanDate(visitDate)}`}
                accessibilityState={{ expanded: calendarOpen }}
                onPress={openCalendar}
                style={({ pressed }) => [styles.dateButton, (calendarOpen || pressed) && styles.dateButtonActive]}>
                <Text style={[styles.dateText, calendarOpen && styles.dateTextActive]}>{formatKoreanDate(visitDate)}</Text>
              </Pressable>
            </View>
            {calendarOpen && (
              <DateTimePicker
                testID="visit-date-calendar"
                value={visitDate}
                mode="date"
                display="inline"
                locale="ko-KR"
                maximumDate={new Date()}
                accentColor={colors.accent}
                themeVariant="light"
                style={styles.calendar}
                onValueChange={(_, date) => {
                  setVisitDate(date);
                  setCalendarOpen(false);
                }}
              />
            )}
          </View>

          <RatingPicker title="높이" labels={HEIGHT_LABELS} value={height} onChange={setHeight} />
          <RatingPicker title="좌우" labels={SIDE_LABELS} value={side} onChange={setSide} />

          <View style={styles.section}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>불편했던 점</Text>
              <Text style={styles.optional}>선택</Text>
            </View>
            <View style={styles.options}>
              {DISCOMFORTS.map(({ id, label }) => {
                const selected = discomforts.includes(id);
                return (
                  <Pressable
                    key={id}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`불편: ${label}`}
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggleDiscomfort(id)}
                    style={[styles.option, selected && styles.discomfortSelected]}>
                    <Text style={[styles.optionText, selected && styles.discomfortTextSelected]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {failed && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>저장하지 못했어요</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave }}
            disabled={!canSave}
            onPress={save}
            style={({ pressed }) => [styles.primary, !canSave && styles.disabled, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>{failed ? '다시 시도' : '저장'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCancel} style={styles.secondary}>
            <Text style={styles.secondaryText}>취소</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

type RatingPickerProps = {
  title: string;
  labels: string[];
  value: Rating | null;
  onChange: (value: Rating) => void;
};

function RatingPicker({ title, labels, value, onChange }: RatingPickerProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.options}>
        {labels.map((label, i) => {
          const rating = (i + 1) as Rating;
          const selected = value === rating;
          return (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityLabel={`${title}: ${label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(rating)}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.seat, marginTop: spacing.sm },
  body: { padding: spacing.xl, gap: spacing.lg },
  subtitle: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: -spacing.md },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  label: { fontSize: 15, fontWeight: '700', color: colors.ink },
  calendar: { alignSelf: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateButton: { backgroundColor: colors.bg, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 8 },
  dateButtonActive: { backgroundColor: colors.accentSoft },
  dateText: { fontSize: 16, color: colors.ink, fontWeight: '600' },
  dateTextActive: { color: colors.accent },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  optional: { fontSize: 13, color: colors.muted },
  discomfortSelected: { backgroundColor: colors.errorSoft, borderColor: colors.error },
  discomfortTextSelected: { color: colors.error, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  optionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionText: { fontSize: 14, color: colors.ink },
  optionTextSelected: { color: colors.onAccent, fontWeight: '700' },
  errorBanner: { backgroundColor: colors.errorSoft, borderRadius: radius.md, padding: spacing.md },
  errorText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.xs },
  primary: { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  primaryPressed: { opacity: 0.85 },
  primaryText: { color: colors.onAccent, fontSize: 17, fontWeight: '700' },
  disabled: { opacity: 0.35 },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
