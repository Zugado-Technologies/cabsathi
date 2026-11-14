import { Ionicons } from '@expo/vector-icons';
import type { Ride, UserPublic } from '@cabsathi/shared';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { shortDay, timeLabel } from '../lib/format';
import { colors, radius } from '../theme';
import { Avatar, Card, Stars } from './ui';

const LEVEL_LABEL = { exact: 'Exact match', nearby: 'Nearby match', flexible: 'Flexible match' } as const;

interface Props {
  ride: Ride;
  user: UserPublic;
  level: keyof typeof LEVEL_LABEL;
  overlapPct: number;
  pickupGapKm: number;
  minsToMeet: number;
  shareRange: { min: number; max: number };
  action: ReactNode;
}

/** One ride card on the Matching Rides screen, laid out like the mockup. */
export function MatchCardView({ ride, user, level, overlapPct, pickupGapKm, minsToMeet, shareRange, action }: Props) {
  return (
    <Card style={{ padding: 0 }}>
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <Ionicons name="car" size={20} color={colors.primary} />
          <Text style={styles.title} numberOfLines={1}>
            {ride.from.name}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="navigate" size={12} color={colors.green} />
          <Text style={styles.meta} numberOfLines={1}>
            to {ride.to.name} · Approx {Math.round(ride.distanceKm)} km · {shortDay(ride.departAt)}{' '}
            {timeLabel(ride.departAt)} · {ride.seats} Seat{ride.seats > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <View style={styles.person}>
        <Avatar name={user.name} verified={user.verified} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name ?? 'CabSathi user'}
              {user.age ? ` ${user.age}` : ''}
            </Text>
            {user.verified && <Ionicons name="checkmark-circle" size={16} color={colors.green} />}
          </View>
          <View style={styles.nameRow}>
            <Stars rating={user.rating} />
            <Text style={styles.overlap} numberOfLines={1}>
              {overlapPct}% shared
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 3 }}>
          <Text style={styles.away}>{pickupGapKm} km away</Text>
          <View style={styles.nameRow}>
            <Ionicons name="time-outline" size={12} color={colors.green} />
            <Text style={styles.small}>{minsToMeet} mins to meet</Text>
          </View>
        </View>
      </View>

      <View style={styles.priceBox}>
        <View style={{ flex: 1 }}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ₹{shareRange.min} - ₹{shareRange.max}
            </Text>
            <Text style={styles.per}>per{'\n'}person</Text>
          </View>
          <View style={styles.nameRow}>
            <View style={styles.dot} />
            <Text style={styles.small}>{LEVEL_LABEL[level]} · suggested fare</Text>
          </View>
        </View>
        {action}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { padding: 14, paddingBottom: 10, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '600', color: colors.text, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13, color: colors.textMuted, flex: 1 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  overlap: { fontSize: 12, color: colors.textMuted },
  away: { fontSize: 14, color: colors.text, textAlign: 'right' },
  small: { fontSize: 12, color: colors.textMuted },
  priceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    gap: 10,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { fontSize: 20, fontWeight: '700', color: colors.green, flexShrink: 1 },
  per: { fontSize: 12, color: colors.textMuted, lineHeight: 13 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
});
