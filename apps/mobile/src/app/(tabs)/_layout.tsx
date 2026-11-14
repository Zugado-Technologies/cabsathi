import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View, type ColorValue } from 'react-native';
import { useSession } from '../../lib/session';
import { colors } from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;
const icon =
  (name: IconName, active: IconName) =>
  ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Ionicons name={focused ? active : name} size={24} color={color as string} />
  );

export default function TabLayout() {
  const { ready, user } = useSession();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.green,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="rides" options={{ title: 'Rides', tabBarIcon: icon('car-outline', 'car') }} />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: icon('chatbox-ellipses-outline', 'chatbox-ellipses') }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
