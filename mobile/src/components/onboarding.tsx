import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, radius, spacing, verdictColors } from '@/constants/theme';

const STEPS = [
  {
    title: '상영관 찾기',
    body: '극장 이름이나 IMAX, 4DX 같은 상영관 종류로 검색할 수 있어요.',
  },
  {
    title: '앉았던 좌석 누르기',
    body: '좌석이 작으면 두 손가락으로 확대하거나, 좌석표 아래에서 열과 번호로 고르면 돼요.',
  },
  {
    title: '높이와 좌우 남기기',
    body: '스크린이 어떻게 보였는지와 불편했던 점을 적어 두면, 다음에 좌석표에서 색으로 보여요.',
  },
];

export function Onboarding({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  function finish() {
    setStep(0);
    onDone();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={finish}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <Illustration step={step} />
          <Text style={styles.count}>
            {step + 1} / {STEPS.length}
          </Text>
          <Text style={styles.title}>{STEPS[step].title}</Text>
          <Text style={styles.body}>{STEPS[step].body}</Text>
          <View style={styles.dots}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.dot, i === step && styles.dotOn]} />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => (last ? finish() : setStep(step + 1))}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            <Text style={styles.primaryText}>{last ? '시작하기' : '다음'}</Text>
          </Pressable>
          {!last && (
            <Pressable accessibilityRole="button" onPress={finish} style={styles.skip}>
              <Text style={styles.skipText}>건너뛰기</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Illustration({ step }: { step: number }) {
  if (step === 0) {
    return (
      <View style={styles.art}>
        <View style={styles.fakeSearch}>
          <Icon name="magnifyingglass" size={15} color={colors.muted} />
          <Text style={styles.fakeSearchText}>신림</Text>
        </View>
        <View style={styles.fakeRow} />
        <View style={[styles.fakeRow, styles.fakeRowShort]} />
      </View>
    );
  }
  const colorsFor = (r: number, c: number) => {
    if (step === 1) return r === 2 && c === 3 ? colors.accent : colors.seat;
    if (r === 2 && c === 3) return verdictColors.good;
    if (r === 0 && c === 1) return verdictColors.bad;
    if (r === 1 && c === 4) return verdictColors.okay;
    return colors.seat;
  };
  return (
    <View style={styles.art}>
      <View style={styles.artScreen} />
      {[0, 1, 2].map((r) => (
        <View key={r} style={styles.artRow}>
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <View key={c} style={[styles.artSeat, { backgroundColor: colorsFor(r, c) }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(31, 26, 29, 0.45)', justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg + 8, padding: spacing.xl, alignItems: 'center' },
  art: {
    width: '100%',
    height: 132,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  artScreen: { width: 150, height: 4, borderRadius: 2, backgroundColor: colors.accent, opacity: 0.35, marginBottom: 6 },
  artRow: { flexDirection: 'row', gap: 8 },
  artSeat: { width: 20, height: 20, borderRadius: 4, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  fakeSearch: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '78%', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10 },
  fakeSearchText: { fontSize: 15, color: colors.ink },
  fakeRow: { width: '78%', height: 12, borderRadius: 6, backgroundColor: colors.surface, opacity: 0.8 },
  fakeRowShort: { width: '52%', alignSelf: 'auto' },
  count: { fontSize: 13, fontWeight: '700', color: colors.accent },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: spacing.xs },
  body: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center', marginTop: spacing.sm },
  dots: { flexDirection: 'row', gap: 6, marginVertical: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.seat },
  dotOn: { width: 18, backgroundColor: colors.accent },
  primary: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14 },
  pressed: { opacity: 0.85 },
  primaryText: { color: colors.onAccent, fontSize: 16, fontWeight: '700' },
  skip: { paddingTop: spacing.md, paddingHorizontal: spacing.lg },
  skipText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
