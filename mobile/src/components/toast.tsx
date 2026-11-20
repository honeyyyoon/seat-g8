import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { colors, radius, spacing } from '@/constants/theme';

export type ToastAction = { label: string; onPress: () => void };

type Props = { title: string; body?: string; action?: ToastAction; onHide: () => void };

export function Toast({ title, body, action, onHide }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility([title, body].filter(Boolean).join(' '));
    const animation = Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(action ? 4000 : 1800),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]);
    animation.start(({ finished }) => finished && onHideRef.current());
    return () => animation.stop();
  }, [title, body, action, opacity]);

  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: insets.bottom + spacing.xl,
          opacity,
          transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}>
      {!action && (
        <View style={styles.check}>
          <Icon name="checkmark" size={14} color={colors.onAccent} weight="bold" />
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {body && <Text style={styles.body}>{body}</Text>}
      </View>
      {action && (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {
            action.onPress();
            onHideRef.current();
          }}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  check: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  title: { color: colors.onAccent, fontSize: 16, fontWeight: '800' },
  body: { color: colors.seat, fontSize: 13 },
  action: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  actionPressed: { backgroundColor: 'rgba(255,255,255,0.12)' },
  actionText: { color: '#F2B8C9', fontSize: 15, fontWeight: '800' },
});
