import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** 1-3 seat slider like the mockup. Tap a number to choose. */
export function SeatSlider({ value, onChange, max = 3 }: { value: number; onChange: (n: number) => void; max?: number }) {
  const pct = max === 1 ? 100 : ((value - 1) / (max - 1)) * 100;
  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.max(pct, 8)}%` }]}
        />
        <View style={[styles.thumb, { left: `${pct}%` }]} />
      </View>
      <View style={styles.stops}>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${n} seat${n > 1 ? 's' : ''}`}
            onPress={() => onChange(n)}
            style={styles.stop}
          >
            <Text style={[styles.stopText, n === value && styles.stopOn]}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4, gap: 2 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#DCE5F5', marginHorizontal: 10, marginTop: 10 },
  fill: { height: 8, borderRadius: 4 },
  thumb: {
    position: 'absolute',
    top: -7,
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    backgroundColor: colors.green,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  stops: { flexDirection: 'row', justifyContent: 'space-between' },
  stop: { paddingHorizontal: 6, paddingVertical: 6 },
  stopText: { fontSize: 14, color: colors.textMuted },
  stopOn: { color: colors.primary, fontWeight: '700' },
});
