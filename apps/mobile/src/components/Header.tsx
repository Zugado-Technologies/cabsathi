import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  title?: string;
  back?: boolean;
  /** Custom left content (e.g. the logo on Home). */
  left?: ReactNode;
  right?: ReactNode;
}

/** Blue gradient header with the wave at the bottom, as in the mockup. */
export function Header({ title, back, left, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View>
      <LinearGradient
        colors={[colors.headerTop, colors.headerBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bar, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.row}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              hitSlop={12}
              style={styles.back}
            >
              <Ionicons name="chevron-back" size={26} color={colors.white} />
            </Pressable>
          )}
          {left}
          {title && <Text style={styles.title}>{title}</Text>}
          <View style={{ flex: 1 }} />
          {right}
        </View>
      </LinearGradient>
      <Svg width="100%" height={22} viewBox="0 0 400 22" preserveAspectRatio="none" style={styles.wave}>
        <Path d="M0 0 H400 V8 C330 24 270 2 200 10 C130 18 70 22 0 8 Z" fill={colors.headerBottom} />
        <Path d="M0 8 C70 22 130 18 200 10 C270 2 330 24 400 8 V12 C330 28 270 6 200 14 C130 22 70 26 0 12 Z" fill="#FFFFFF" opacity={0.35} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 18, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
  back: { marginRight: 8 },
  title: { color: colors.white, fontSize: 22, fontWeight: '600' },
  wave: { marginTop: -1 },
});
