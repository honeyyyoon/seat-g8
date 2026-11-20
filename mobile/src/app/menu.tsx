import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Onboarding } from '@/components/onboarding';
import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/constants/theme';
import { isAnalyticsOn, setAnalyticsOn } from '@/lib/analytics';

export default function MenuScreen() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [analytics, setAnalytics] = useState(isAnalyticsOn);

  function toggleAnalytics(on: boolean) {
    setAnalytics(on);
    setAnalyticsOn(on).catch(() => setAnalytics(!on));
  }
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
          <View style={styles.labelBox}>
            <Text style={styles.label}>사용 통계 보내기</Text>
            <Text style={styles.sub}>기록 내용 없이, 앱을 어떻게 쓰는지만 익명으로 보내요</Text>
          </View>
          <Switch
            accessibilityLabel="사용 통계 보내기"
            value={analytics}
            onValueChange={toggleAnalytics}
            trackColor={{ true: colors.accent }}
          />
        </View>
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
  labelBox: { flex: 1, gap: 2, marginRight: spacing.md },
  sub: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  value: { fontSize: 15, color: colors.muted },
});
