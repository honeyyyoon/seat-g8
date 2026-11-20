import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePinchGesture } from 'react-native-gesture-handler';

import { Icon } from '@/components/icon';
import { Text } from '@/components/text';
import { verdictLabel, type Verdict } from '@/constants/ratings';
import { colors, radius, verdictColors, verdictIcons, verdictInk } from '@/constants/theme';
import { seatKey, type Layout, type Seat } from '@/data/layouts';

const ROW_LABEL_WIDTH = 20;
const ZOOM_LEVELS = [1, 1.6, 2.4];
const MAX_CELL = 48;

type Props = {
  layout: Layout;
  verdicts: Map<string, Verdict>;
  highlight?: { row: string; number: number | null } | null;
  onPressSeat: (seat: Seat) => void;
};

export function SeatGrid({ layout, verdicts, highlight = null, onPressSeat }: Props) {
  const { width } = useWindowDimensions();
  const [factor, setFactor] = useState(1);
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const viewportWidth = useRef(width);
  const baseCell = Math.max(14, Math.min(28, Math.floor((width - 64 - ROW_LABEL_WIDTH) / layout.grid.width)));
  const zoomable = baseCell < 24;
  const maxFactor = Math.min(ZOOM_LEVELS[ZOOM_LEVELS.length - 1], MAX_CELL / baseCell);
  const clampFactor = (f: number) => Math.min(maxFactor, Math.max(1, f));
  const cell = Math.round(baseCell * factor);
  const canZoomIn = factor < maxFactor - 0.01;
  const canZoomOut = factor > 1.01;

  const factorRef = useRef(factor);
  factorRef.current = factor;
  const clampRef = useRef(clampFactor);
  clampRef.current = clampFactor;

  const pinch = usePinchGesture({
    runOnJS: true,
    onUpdate: (e) => pinchScale.setValue(clampRef.current(factorRef.current * e.scale) / factorRef.current),
    onDeactivate: (e) => {
      setFactor(clampRef.current(factorRef.current * e.scale));
      pinchScale.setValue(1);
    },
  });

  function zoomIn() {
    setFactor(clampFactor(ZOOM_LEVELS.find((level) => level > factor + 0.01) ?? maxFactor));
  }

  function zoomOut() {
    setFactor(clampFactor([...ZOOM_LEVELS].reverse().find((level) => level < factor - 0.01) ?? 1));
  }

  const highlighted = highlight
    ? layout.seats.find((s) => s.row === highlight.row && s.number === highlight.number)
    : undefined;
  const highlightX = highlighted ? ROW_LABEL_WIDTH + highlighted.x * cell : null;

  useEffect(() => {
    if (highlightX === null) return;
    scrollRef.current?.scrollTo({ x: Math.max(0, highlightX + 16 + cell / 2 - viewportWidth.current / 2), animated: true });
  }, [highlightX, cell]);

  const rowLabels = new Map(layout.seats.map((seat) => [seat.y, seat.row]));
  const gridWidth = layout.grid.width * cell;
  const showNumbers = cell >= 22;

  return (
    <View>
      <View style={styles.zoomBar}>
        <Text style={styles.title}>좌석표에서 고르기</Text>
        {zoomable && (
          <>
            <ZoomButton icon="minus" name="좌석표 축소" disabled={!canZoomOut} onPress={zoomOut} />
            <ZoomButton icon="plus" name="좌석표 확대" disabled={!canZoomIn} onPress={zoomIn} />
          </>
        )}
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onLayout={(e) => {
          viewportWidth.current = e.nativeEvent.layout.width;
        }}
        onContentSizeChange={(contentWidth) =>
          requestAnimationFrame(() =>
            scrollRef.current?.scrollTo({
              x: Math.max(0, (contentWidth - viewportWidth.current) / 2),
              animated: false,
            }),
          )
        }>
        <GestureDetector gesture={pinch}>
          <Animated.View style={{ transform: [{ scale: pinchScale }] }}>
            <View style={[styles.screenWrap, { marginLeft: ROW_LABEL_WIDTH, width: gridWidth }]}>
              <View style={styles.screenBar} />
              <Text maxFontSizeMultiplier={1} style={styles.screenText}>
                SCREEN
              </Text>
            </View>
            <View
              style={{
                width: ROW_LABEL_WIDTH + gridWidth,
                height: layout.grid.height * cell,
              }}>
              {[...rowLabels].map(([y, row]) => (
                <Text
                  key={`row-${y}`}
                  maxFontSizeMultiplier={1}
                  style={[
                    styles.rowLabel,
                    row === highlight?.row && styles.rowLabelActive,
                    { top: y * cell, height: cell, lineHeight: cell },
                  ]}>
                  {row}
                </Text>
              ))}
              {layout.seats.map((seat) => {
                const verdict = verdicts.get(seatKey(seat.row, seat.number));
                const marked = verdict !== undefined;
                const active = seat === highlighted;
                const size = cell - 3;
                return (
                  <Pressable
                    key={seatKey(seat.row, seat.number)}
                    accessibilityRole="button"
                    accessibilityLabel={`${seat.row}열 ${seat.number}번${marked ? ', 내가 앉았던 좌석' : ''}`}
                    accessibilityState={{ selected: active }}
                    accessibilityValue={verdict ? { text: verdictLabel(verdict) } : undefined}
                    onPress={() => onPressSeat(seat)}
                    hitSlop={2}
                    style={[
                      styles.seat,
                      verdict && { backgroundColor: verdictColors[verdict], borderWidth: 0 },
                      active && (marked ? styles.activeMarked : styles.active),
                      {
                        left: ROW_LABEL_WIDTH + seat.x * cell,
                        top: seat.y * cell,
                        width: size,
                        height: size,
                        borderTopLeftRadius: size * 0.4,
                        borderTopRightRadius: size * 0.4,
                      },
                    ]}>
                    {verdict ? (
                      <Icon
                        name={verdictIcons[verdict]}
                        size={Math.max(7, Math.round(size * 0.5))}
                        color={verdictInk[verdict]}
                        weight="bold"
                      />
                    ) : (
                      showNumbers && (
                        <Text maxFontSizeMultiplier={1} style={styles.seatNumber}>
                          {seat.number}
                        </Text>
                      )
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </GestureDetector>
      </ScrollView>
    </View>
  );
}

function ZoomButton({
  icon,
  name,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  name: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [styles.zoomButton, disabled && styles.zoomDisabled, pressed && styles.zoomPressed]}>
      <Icon name={icon} size={16} color={colors.ink} weight="bold" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 20 },
  screenWrap: { alignItems: 'center', marginBottom: 20 },
  screenBar: {
    width: '86%',
    height: 6,
    backgroundColor: colors.accent,
    opacity: 0.35,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  screenText: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 3,
    color: colors.muted,
    fontWeight: '600',
  },
  rowLabel: {
    position: 'absolute',
    left: 0,
    width: ROW_LABEL_WIDTH - 4,
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
  },
  seat: {
    position: 'absolute',
    borderRadius: 3,
    backgroundColor: colors.seatFill,
    borderWidth: 1,
    borderColor: colors.seatEdge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.accentSoft, borderWidth: 2, borderColor: colors.accent },
  activeMarked: { borderWidth: 2, borderColor: colors.ink },
  rowLabelActive: { color: colors.accent, fontWeight: '800' },
  seatNumber: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  zoomBar: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingHorizontal: 16, paddingTop: 16 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.ink },
  zoomButton: {
    width: 44,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDisabled: { opacity: 0.35 },
  zoomPressed: { backgroundColor: colors.line },
});
