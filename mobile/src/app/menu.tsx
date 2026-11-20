import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Onboarding } from '@/components/onboarding';
import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/constants/theme';

export default function MenuScreen() {
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <MenuRow label="사용법" onPress={() => setGuideOpen(true)} first />
        <MenuRow label="내 기록" onPress={() => router.push('/visits')} />
        <MenuRow label="극장 지도" onPress={() => router.push('/map')} />
      </View>
      <View style={styles.card}>
        <MenuRow label="개인정보 처리 안내" onPress={() => router.push('/privacy')} first />
        <View style={[styles.row, styles.divider]}>
          <Text style={styles.label}>버전</Text>
          <Text style={styles.value}>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </View>
      <Onboarding visible={guideOpen} onDone={() => setGuideOpen(false)} />
    </ScrollView>
  );
}

function MenuRow({ label, onPress, first = false }: { label: string; onPress: () => void; first?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}>
      <Text style={styles.label}>{label}</Text>
      <Icon name="chevron.right" size={13} color={colors.seatEdge} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingLeft: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingRight: spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  pressed: { opacity: 0.6 },
  label: { flex: 1, fontSize: 16, color: colors.ink },
  value: { fontSize: 15, color: colors.muted },
});
