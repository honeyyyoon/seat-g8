import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors } from '@/constants/theme';
import { seatKey, type Layout, type Seat } from '@/data/layouts';

const ROW_LABEL_WIDTH = 20;

type Props = {
  layout: Layout;
  markedSeats: Set<string>;
  onPressSeat: (seat: Seat) => void;
};

export function SeatGrid({ layout, markedSeats, onPressSeat }: Props) {
  const { width } = useWindowDimensions();
  const cell = Math.max(14, Math.min(28, Math.floor((width - 64 - ROW_LABEL_WIDTH) / layout.grid.width)));
  const rowLabels = new Map(layout.seats.map((seat) => [seat.y, seat.row]));
  const gridWidth = layout.grid.width * cell;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View>
        <View style={[styles.screenWrap, { marginLeft: ROW_LABEL_WIDTH, width: gridWidth }]}>
          <View style={styles.screenBar} />
          <Text style={styles.screenText}>SCREEN</Text>
        </View>
        <View style={{ width: ROW_LABEL_WIDTH + gridWidth, height: layout.grid.height * cell }}>
          {[...rowLabels].map(([y, row]) => (
            <Text key={`row-${y}`} style={[styles.rowLabel, { top: y * cell, height: cell, lineHeight: cell }]}>
              {row}
            </Text>
          ))}
          {layout.seats.map((seat) => {
            const marked = markedSeats.has(seatKey(seat.row, seat.number));
            const size = cell - 3;
            return (
              <Pressable
                key={seatKey(seat.row, seat.number)}
                accessibilityRole="button"
                accessibilityLabel={`${seat.row}열 ${seat.number}번${marked ? ', 내가 앉았던 좌석' : ''}`}
                onPress={() => onPressSeat(seat)}
                hitSlop={2}
                style={[
                  styles.seat,
                  marked && styles.marked,
                  {
                    left: ROW_LABEL_WIDTH + seat.x * cell,
                    top: seat.y * cell,
                    width: size,
                    height: size,
                    borderTopLeftRadius: size * 0.4,
                    borderTopRightRadius: size * 0.4,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </ScrollView>
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
  screenText: { marginTop: 6, fontSize: 10, letterSpacing: 3, color: colors.muted, fontWeight: '600' },
  rowLabel: { position: 'absolute', left: 0, width: ROW_LABEL_WIDTH - 4, fontSize: 10, fontWeight: '700', color: colors.muted, textAlign: 'center' },
  seat: { position: 'absolute', borderRadius: 3, backgroundColor: colors.seat },
  marked: { backgroundColor: colors.accent },
});
