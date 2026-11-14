import type { Gender } from '@cabsathi/shared';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header } from '../../components/Header';
import { Avatar, Card, ErrorText, GreenButton, Segmented, Stars } from '../../components/ui';
import { api } from '../../lib/api';
import { useSession } from '../../lib/session';
import { colors, radius } from '../../theme';

export default function Profile() {
  const { user, setUser, signOut } = useSession();
  const [name, setName] = useState(user?.name ?? '');
  const [gender, setGender] = useState<Gender | ''>(user?.gender ?? '');
  const [birthYear, setBirthYear] = useState(user?.age ? String(new Date().getFullYear() - user.age) : '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.updateMe({
        name: name.trim() || undefined,
        gender: gender || undefined,
        birthYear: birthYear ? Number(birthYear) : undefined,
      });
      setUser(updated);
      setMessage('Profile saved');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title="Profile" />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={styles.top}>
          <Avatar name={user.name} size={64} verified={user.verified} />
          <View style={{ gap: 4 }}>
            <Text style={styles.name}>{user.name ?? 'Add your name'}</Text>
            <Text style={styles.phone}>+91 {user.phone}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Stars rating={user.rating} />
              <Text style={styles.phone}>
                {user.rating.toFixed(1)} · {user.ridesCount} rides
              </Text>
            </View>
          </View>
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" style={styles.input} placeholderTextColor={colors.textFaint} />
          <Text style={styles.label}>Gender</Text>
          <Segmented
            value={gender || ('none' as Gender)}
            onChange={(g) => setGender(g)}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Text style={styles.label}>Birth year</Text>
          <TextInput
            value={birthYear}
            onChangeText={(t) => setBirthYear(t.replace(/\D/g, '').slice(0, 4))}
            placeholder="1998"
            keyboardType="number-pad"
            style={styles.input}
            placeholderTextColor={colors.textFaint}
          />
          <ErrorText message={error} />
          {message && <Text style={styles.ok}>{message}</Text>}
          <GreenButton label="Save" size="sm" onPress={save} loading={saving} />
        </Card>

        <Pressable onPress={signOut} style={styles.logout} accessibilityRole="button">
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, paddingTop: 4, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  phone: { fontSize: 14, color: colors.textMuted },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 16,
    color: colors.text,
  },
  ok: { color: colors.green, fontSize: 13 },
  logout: { alignItems: 'center', padding: 14 },
  logoutText: { color: colors.red, fontWeight: '600', fontSize: 15 },
});
