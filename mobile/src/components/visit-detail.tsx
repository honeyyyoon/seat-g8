import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HEIGHT_LABELS, SIDE_LABELS } from '@/constants/ratings';
import { colors, radius, spacing } from '@/constants/theme';
import type { Seat } from '@/data/layouts';
import type { Visit } from '@/db/visits';

type Props = {
  visible: boolean;
  subtitle: string;
  seat: Seat;
  visits: Visit[];
  onRecordAgain: () => void;
  onClose: () => void;
  onDismiss: () => void;
};

export function VisitDetail({ visible, subtitle, seat, visits, onRecordAgain, onClose, onDismiss }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onDismiss={onDismiss}>
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.title}>
            {seat.row}열 {seat.number}번
          </Text>
          <Text style={styles.count}>이 좌석에 {visits.length}번 앉았어요</Text>

          {visits.map((visit) => (
            <View key={visit.id} style={styles.card}>
              <Text style={styles.date}>{visit.visitDate}</Text>
              <View style={styles.ratings}>
                <Rating label="높이" value={HEIGHT_LABELS[visit.height - 1]} />
                <Rating label="좌우" value={SIDE_LABELS[visit.side - 1]} />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={onRecordAgain}
            style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>이 좌석 다시 기록하기</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondary}>
            <Text style={styles.secondaryText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Rating({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rating}>
      <Text style={styles.ratingLabel}>{label}</Text>
      <Text style={styles.ratingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.seat, marginTop: spacing.sm },
  body: { padding: spacing.xl, gap: spacing.md },
  subtitle: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  title: { fontSize: 30, fontWeight: '800', color: colors.ink, marginTop: -spacing.sm },
  count: { fontSize: 15, color: colors.accent, fontWeight: '600', marginBottom: spacing.sm },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  date: { fontSize: 17, fontWeight: '700', color: colors.ink },
  ratings: { flexDirection: 'row', gap: spacing.sm },
  rating: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, gap: 2 },
  ratingLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  ratingValue: { fontSize: 16, color: colors.ink, fontWeight: '700' },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl, gap: spacing.xs },
  primary: { backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  primaryPressed: { opacity: 0.85 },
  primaryText: { color: colors.onAccent, fontSize: 17, fontWeight: '700' },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});
