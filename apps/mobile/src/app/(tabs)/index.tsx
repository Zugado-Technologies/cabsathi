import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Header } from '../../components/Header';
import { GreenButton } from '../../components/ui';
import { greeting } from '../../lib/format';
import { useSession } from '../../lib/session';
import { storage } from '../../lib/storage';
import { colors, radius, shadow } from '../../theme';

const TIPS = [
  'Please share payment early before completing the ride.',
  'Do not share your personal information for your safety.',
  'Report any suspicious or improper behaviour immediately.',
];
const TIPS_KEY = 'cabsathi.tipsDismissed';

export default function Home() {
  const { user } = useSession();
  const [showTips, setShowTips] = useState(true);

  useEffect(() => {
    storage.get(TIPS_KEY).then((v) => v === '1' && setShowTips(false));
  }, []);

  const dismissTips = () => {
    setShowTips(false);
    storage.set(TIPS_KEY, '1');
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <View style={{ flex: 1 }}>
      <Header
        left={
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <Text style={styles.brandText}>CabSathi</Text>
          </View>
        }
        right={
          <Pressable accessibilityLabel="Notifications" hitSlop={10}>
            <Ionicons name="notifications" size={26} color={colors.white} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.greeting}>
          {greeting()}
          {firstName ? `, ${firstName}!` : '!'}
        </Text>
        <Pressable style={styles.area}>
          <Ionicons name="location" size={18} color={colors.primaryDark} />
          <Text style={styles.areaText}>Delhi NCR</Text>
          <Ionicons name="chevron-down" size={14} color={colors.text} />
        </Pressable>

        <View style={styles.panel}>
          <GreenButton label="Create Ride" icon="add" onPress={() => router.push('/create-ride')} />

          {showTips && (
            <View style={styles.tips}>
              <View style={styles.tipsHead}>
                <Ionicons name="ellipse" size={14} color={colors.orange} />
                <Text style={styles.tipsTitle}>Tips</Text>
              </View>
              {TIPS.map((t) => (
                <View key={t} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                  <Text style={styles.tipText}>{t}</Text>
                </View>
              ))}
              <Pressable onPress={dismissTips} style={styles.gotIt} accessibilityRole="button">
                <Text style={styles.gotItText}>Got it</Text>
              </Pressable>
            </View>
          )}
        </View>

        <LinearGradient colors={['#1E40AF', '#3B82F6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ad}>
          <View style={styles.adTag}>
            <Text style={styles.adTagText}>Ad</Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.adTitle}>Advertise Your{'\n'}Business Here</Text>
            <Text style={styles.adSub}>Boost your local presence with us</Text>
            <GreenButton label="Get Started" size="sm" onPress={() => {}} style={{ alignSelf: 'flex-start', marginTop: 6 }} />
          </View>
          <Ionicons name="megaphone" size={64} color="#DBEAFE" />
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { color: colors.white, fontSize: 24, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.red,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  body: { padding: 20, paddingTop: 8, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text },
  area: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  areaText: { fontSize: 16, color: colors.text },
  panel: {
    backgroundColor: '#EEF3FB',
    borderRadius: radius.xl,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tips: {
    backgroundColor: colors.tipsBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.tipsBorder,
    padding: 16,
    gap: 12,
  },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipsTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  tipRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tipText: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  gotIt: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginTop: -4,
  },
  gotItText: { color: colors.white, fontWeight: '600' },
  ad: {
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    ...shadow,
  },
  adTag: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: colors.green,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  adTagText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  adTitle: { color: colors.white, fontSize: 20, fontWeight: '700', lineHeight: 25 },
  adSub: { color: '#DBEAFE', fontSize: 13 },
});
