import { Ionicons } from '@expo/vector-icons';
import type { MatchCard, ReceivedRequest, Ride } from '@cabsathi/shared';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../../components/Header';
import { MatchCardView } from '../../components/MatchCardView';
import { Empty, ErrorText, GreenButton, OutlineButton } from '../../components/ui';
import { api } from '../../lib/api';
import { dayLabel, timeLabel } from '../../lib/format';
import { colors, radius } from '../../theme';

type Tab = 'nearby' | 'received';

export default function Matches() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [tab, setTab] = useState<Tab>('nearby');
  const [ride, setRide] = useState<Ride | null>(null);
  const [matches, setMatches] = useState<MatchCard[] | null>(null);
  const [received, setReceived] = useState<ReceivedRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!rideId) return;
    try {
      const [r, m, rq] = await Promise.all([api.ride(rideId), api.matches(rideId), api.receivedRequests()]);
      setRide(r);
      setMatches(m);
      setReceived(rq.filter((x) => x.toRide.id === rideId));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setMatches([]);
    }
  }, [rideId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const act = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pending = received.filter((r) => r.status === 'pending').length;

  return (
    <View style={{ flex: 1 }}>
      <Header title="Matching Rides" back right={<Ionicons name="settings-sharp" size={24} color={colors.white} />} />
      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {(['nearby', 'received'] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>
                {t === 'nearby' ? 'Nearby Requests' : `Received Requests${pending ? ` (${pending})` : ''}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {ride && (
          <Text style={styles.myRide}>
            Your ride: {ride.from.name} → {ride.to.name} · {dayLabel(ride.departAt)}, {timeLabel(ride.departAt)}
            {ride.status !== 'published' ? ` · ${ride.status}` : ''}
          </Text>
        )}
        <ErrorText message={error} />
        {matches === null ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : tab === 'nearby' ? (
          matches.length === 0 ? (
            <Empty
              icon="search"
              title="No matching rides yet"
              body="We'll show people going your way here as soon as they post a ride. Pull down to refresh."
            />
          ) : (
            matches.map((m) => (
              <MatchCardView
                key={m.ride.id}
                {...m}
                action={
                  m.requestStatus ? (
                    <View style={styles.sent}>
                      <Text style={styles.sentText}>{m.requestStatus === 'pending' ? 'Requested' : m.requestStatus}</Text>
                    </View>
                  ) : (
                    <GreenButton
                      size="sm"
                      label="Send request"
                      loading={busy === m.ride.id}
                      onPress={() => act(m.ride.id, () => api.sendRequest(rideId!, m.ride.id))}
                    />
                  )
                }
              />
            ))
          )
        ) : received.length === 0 ? (
          <Empty icon="mail-open-outline" title="No requests yet" body="When someone asks to share your cab, it shows up here." />
        ) : (
          received.map((r) => (
            <MatchCardView
              key={r.id}
              ride={r.fromRide}
              user={r.fromUser}
              level={r.match?.level ?? 'flexible'}
              overlapPct={r.match?.overlapPct ?? 0}
              pickupGapKm={r.match?.pickupGapKm ?? 0}
              minsToMeet={r.match?.minsToMeet ?? 0}
              shareRange={r.match?.shareRange ?? { min: 0, max: 0 }}
              action={
                r.status === 'pending' ? (
                  <View style={{ gap: 6 }}>
                    <GreenButton
                      size="sm"
                      label="Accept"
                      loading={busy === `a${r.id}`}
                      onPress={() => act(`a${r.id}`, () => api.acceptRequest(r.id))}
                    />
                    <OutlineButton label="Reject" color={colors.red} onPress={() => act(`r${r.id}`, () => api.rejectRequest(r.id))} />
                  </View>
                ) : (
                  <View style={[styles.sent, { backgroundColor: colors.greenLight }]}>
                    <Text style={[styles.sentText, { color: colors.greenDark }]}>Accepted</Text>
                  </View>
                )
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingHorizontal: 16, paddingBottom: 8, maxWidth: 560, width: '100%', alignSelf: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: radius.pill, alignItems: 'center' },
  tabOn: { backgroundColor: colors.green },
  tabText: { fontSize: 14, color: colors.text },
  tabTextOn: { color: colors.white, fontWeight: '600' },
  body: { padding: 16, paddingTop: 4, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  myRide: { fontSize: 13, color: colors.textMuted },
  sent: { backgroundColor: '#EEF2FA', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
  sentText: { color: colors.primary, fontWeight: '600', textTransform: 'capitalize' },
});
