import { Ionicons } from '@expo/vector-icons';
import type { GenderPref, Place, RideEstimate } from '@cabsathi/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../components/Header';
import { PlaceField } from '../components/PlaceField';
import { SeatSlider } from '../components/SeatSlider';
import { Card, ErrorText, GreenButton, Segmented } from '../components/ui';
import { api } from '../lib/api';
import { dayLabel, istDate, rupees, timeLabel } from '../lib/format';
import { useSession } from '../lib/session';
import { colors, radius } from '../theme';

const STEP_MIN = 15;

/** Next quarter hour at least 30 min from now, in India time (minutes of day). */
function defaultTime() {
  const ist = new Date(Date.now() + 5.5 * 3600_000 + 30 * 60_000);
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return Math.ceil(mins / STEP_MIN) * STEP_MIN;
}

export default function CreateRide() {
  const { user } = useSession();
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [day, setDay] = useState(() => (defaultTime() >= 24 * 60 ? 1 : 0));
  const [minutes, setMinutes] = useState(() => defaultTime() % (24 * 60));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [seats, setSeats] = useState(1);
  const [genderPref, setGenderPref] = useState<GenderPref>('any');
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const departAt = istDate(day, minutes);

  useEffect(() => {
    setEstimate(null);
    if (from && to) api.estimate(from, to).then(setEstimate).catch(() => {});
  }, [from, to]);

  const changeTime = (delta: number) => {
    let m = minutes + delta;
    let d = day;
    if (m < 0) [m, d] = [m + 1440, d - 1];
    if (m >= 1440) [m, d] = [m - 1440, d + 1];
    if (d < 0 || d > 6) return;
    setDay(d);
    setMinutes(m);
  };

  const submit = async () => {
    if (!from || !to) return setError('Choose where you start and where you are going');
    if (departAt.getTime() < Date.now()) return setError('Pick a time in the future');
    if (genderPref === 'same' && !user?.gender) return setError('Add your gender in Profile to use "Same gender only"');
    setError(null);
    setSaving(true);
    try {
      const ride = await api.createRide({ from, to, departAt: departAt.toISOString(), seats, genderPref });
      router.replace({ pathname: '/matches/[rideId]', params: { rideId: ride.id } });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Create a Ride" back />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Card style={{ gap: 10, zIndex: 20 }}>
          <Label icon="location" color={colors.orange} text="From" />
          <View style={{ zIndex: 30 }}>
            <PlaceField value={from} onChange={setFrom} placeholder="Where are you starting?" pinColor={colors.red} trailing="clear" />
          </View>
          <Label icon="location" color={colors.green} text="To" />
          <View style={{ zIndex: 20 }}>
            <PlaceField value={to} onChange={setTo} placeholder="Where are you going?" pinColor={colors.green} trailing="search" />
          </View>
          <Pressable onPress={() => setPickerOpen((o) => !o)} style={styles.dateField} accessibilityRole="button">
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.dateText}>{dayLabel(departAt.toISOString())}</Text>
            <View style={styles.divider} />
            <Text style={styles.dateText}>{timeLabel(departAt.toISOString())}</Text>
          </Pressable>
          {pickerOpen && (
            <View style={styles.picker}>
              <View style={styles.chips}>
                {[0, 1, 2].map((d) => (
                  <Pressable key={d} onPress={() => setDay(d)} style={[styles.chip, day === d && styles.chipOn]}>
                    <Text style={[styles.chipText, day === d && styles.chipTextOn]}>
                      {d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : dayLabel(istDate(2, 0).toISOString()).split(',')[0]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.timeRow}>
                <Pressable accessibilityLabel="Earlier" onPress={() => changeTime(-STEP_MIN)} style={styles.step}>
                  <Ionicons name="remove" size={20} color={colors.primary} />
                </Pressable>
                <Text style={styles.timeBig}>{timeLabel(departAt.toISOString())}</Text>
                <Pressable accessibilityLabel="Later" onPress={() => changeTime(STEP_MIN)} style={styles.step}>
                  <Ionicons name="add" size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          )}
        </Card>

        <Card style={{ gap: 10 }}>
          <Label icon="people" color={colors.primary} text="Seats" />
          <View style={styles.seatRow}>
            <Ionicons name="person" size={18} color={colors.textMuted} />
            <Text style={styles.seatText}>
              {seats} seat{seats > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </View>
          <SeatSlider value={seats} onChange={setSeats} />
        </Card>

        <Card style={{ gap: 10 }}>
          <Label icon="shield-checkmark-outline" color={colors.primary} text="Gender preference" />
          <Segmented
            value={genderPref}
            onChange={setGenderPref}
            options={[
              { value: 'any', label: 'Open to all', icon: 'lock-open-outline' },
              { value: 'same', label: 'Same gender only' },
            ]}
          />
        </Card>

        <View style={styles.footer}>
          <View style={styles.approxRow}>
            <Text style={styles.approx}>
              Approx: <Text style={styles.approxValue}>{estimate ? rupees(estimate.soloFare) : '—'}</Text>
            </Text>
            <Text style={styles.suggested}>Suggested</Text>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
            {estimate && (
              <Text style={styles.approxMeta}>
                · {estimate.distanceKm} km · {estimate.durationMin} min
              </Text>
            )}
          </View>
          <ErrorText message={error} />
          <GreenButton label="Create Ride" onPress={submit} loading={saving} />
        </View>
      </ScrollView>
    </View>
  );
}

function Label({ icon, color, text }: { icon: keyof typeof Ionicons.glyphMap; color: string; text: string }) {
  return (
    <View style={styles.label}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.labelText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 4, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  label: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelText: { fontSize: 17, fontWeight: '600', color: colors.text },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  dateText: { fontSize: 16, color: colors.text },
  divider: { width: 1, height: 20, backgroundColor: colors.border, marginHorizontal: 6 },
  picker: { gap: 12, paddingTop: 4 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextOn: { color: colors.white, fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  step: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeBig: { fontSize: 22, fontWeight: '600', color: colors.text, minWidth: 110, textAlign: 'center' },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
  },
  seatText: { flex: 1, fontSize: 16, color: colors.text },
  footer: { gap: 12, paddingTop: 4 },
  approxRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  approx: { fontSize: 17, color: colors.textMuted },
  approxValue: { color: colors.primary, fontWeight: '700' },
  suggested: { fontSize: 15, color: colors.textMuted },
  approxMeta: { fontSize: 13, color: colors.textFaint },
});
