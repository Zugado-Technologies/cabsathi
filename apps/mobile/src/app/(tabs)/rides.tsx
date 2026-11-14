import { Ionicons } from '@expo/vector-icons';
import type { Ride } from '@cabsathi/shared';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../../components/Header';
import { Card, Empty, GreenButton } from '../../components/ui';
import { api } from '../../lib/api';
import { dayLabel, rupees, timeLabel } from '../../lib/format';
import { colors, radius } from '../../theme';

const STATUS = {
  published: { label: 'Looking for matches', bg: '#EEF2FA', fg: colors.primary },
  matched: { label: 'Matched', bg: colors.greenLight, fg: colors.greenDark },
  cancelled: { label: 'Cancelled', bg: '#FDECEC', fg: colors.red },
  completed: { label: 'Completed', bg: '#F1F4F9', fg: colors.textMuted },
};

export default function Rides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.myRides().then(setRides).catch(() => {});
  }, []);
  useFocusEffect(load);

  return (
    <View style={{ flex: 1 }}>
      <Header title="My Rides" />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await api.myRides().then(setRides).catch(() => {});
              setRefreshing(false);
            }}
          />
        }
      >
        {rides.length === 0 ? (
          <>
            <Empty icon="car-outline" title="No rides yet" body="Create a ride and we'll find people going your way." />
            <GreenButton label="Create Ride" icon="add" onPress={() => router.push('/create-ride')} />
          </>
        ) : (
          rides.map((r) => {
            const s = STATUS[r.status];
            return (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/matches/[rideId]', params: { rideId: r.id } })}
              >
                <Card style={{ gap: 8 }}>
                  <View style={styles.row}>
                    <Text style={styles.when}>
                      {dayLabel(r.departAt)}, {timeLabel(r.departAt)}
                    </Text>
                    <View style={[styles.pill, { backgroundColor: s.bg }]}>
                      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
                    </View>
                  </View>
                  <View style={styles.row}>
                    <Ionicons name="ellipse" size={10} color={colors.red} />
                    <Text style={styles.place}>{r.from.name}</Text>
                  </View>
                  <View style={styles.row}>
                    <Ionicons name="location" size={12} color={colors.green} />
                    <Text style={styles.place}>{r.to.name}</Text>
                  </View>
                  <Text style={styles.meta}>
                    {r.distanceKm} km · {r.seats} seat{r.seats > 1 ? 's' : ''} · solo fare approx {rupees(r.soloFare)}
                  </Text>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 4, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  when: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  pillText: { fontSize: 12, fontWeight: '600' },
  place: { fontSize: 15, color: colors.text },
  meta: { fontSize: 13, color: colors.textMuted },
});
