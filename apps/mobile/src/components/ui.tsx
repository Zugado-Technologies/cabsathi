import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { initials } from '../lib/format';
import { colors, radius, shadow } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Big green pill button (Create Ride). */
export function GreenButton({
  label,
  onPress,
  icon,
  loading,
  size = 'lg',
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  size?: 'lg' | 'sm';
  style?: StyleProp<ViewStyle>;
}) {
  const small = size === 'sm';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={loading ? undefined : onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, style]}
    >
      <LinearGradient
        colors={['#2BB37F', colors.green]}
        style={[styles.green, small && styles.greenSmall]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={small ? 16 : 26} color={colors.white} />}
            <Text style={[styles.greenText, small && styles.greenTextSmall]}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, color = colors.primary }: { label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.outline, { borderColor: color, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.outlineText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const AVATAR_COLORS = ['#DBEAFE', '#FCE7F3', '#DCFCE7', '#FEF3C7', '#EDE9FE'];
const AVATAR_TEXT = ['#1D4ED8', '#BE185D', '#15803D', '#B45309', '#6D28D9'];

export function Avatar({ name, size = 44, verified }: { name: string | null; size?: number; verified?: boolean }) {
  const i = (name ?? '').length % AVATAR_COLORS.length;
  return (
    <View>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: AVATAR_COLORS[i],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: AVATAR_TEXT[i], fontWeight: '700', fontSize: size * 0.36 }}>{initials(name)}</Text>
      </View>
      {verified && (
        <View style={styles.avatarBadge}>
          <Ionicons name="checkmark" size={10} color={colors.white} />
        </View>
      )}
    </View>
  );
}

export function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={rating >= n - 0.25 ? 'star' : rating >= n - 0.75 ? 'star-half' : 'star-outline'}
          size={13}
          color={colors.star}
        />
      ))}
    </View>
  );
}

/** Two-option toggle like "Open to all / Same gender only". */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: keyof typeof Ionicons.glyphMap }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, on && styles.segmentOn]}
          >
            {o.icon && <Ionicons name={o.icon} size={14} color={on ? colors.white : colors.green} />}
            <Text style={[styles.segmentText, on && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

export function Empty({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={colors.textFaint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  green: {
    borderRadius: radius.pill,
    paddingVertical: 15,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  greenSmall: { paddingVertical: 9, paddingHorizontal: 14, gap: 4 },
  greenText: { color: colors.white, fontSize: 22, fontWeight: '600' },
  greenTextSmall: { fontSize: 14 },
  outline: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  outlineText: { fontWeight: '600', fontSize: 14 },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F1F4F9',
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  segmentOn: { backgroundColor: colors.green },
  segmentText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  error: { color: colors.red, fontSize: 13, marginTop: 6 },
  empty: { alignItems: 'center', padding: 32, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyBody: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
