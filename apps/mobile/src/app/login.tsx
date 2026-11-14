import { Ionicons } from '@expo/vector-icons';
import { phoneSchema } from '@cabsathi/shared';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header } from '../components/Header';
import { Card, ErrorText, GreenButton } from '../components/ui';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { colors, radius } from '../theme';

export default function Login() {
  const { user, signIn } = useSession();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/" />;

  const send = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    setError(null);
    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      setDevMode(res.devMode);
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code');
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code);
      await signIn(res.token, res.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header
        left={
          <View style={styles.brand}>
            <Ionicons name="people-circle" size={34} color={colors.white} />
            <Text style={styles.brandText}>CabSathi</Text>
          </View>
        }
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <Text style={styles.h1}>{step === 'phone' ? 'Welcome' : 'Enter the code'}</Text>
        <Text style={styles.sub}>
          {step === 'phone'
            ? 'Share your cab with people going your way and split the fare.'
            : `We sent a 6-digit code to +91 ${phone}.`}
        </Text>
        <Card style={{ gap: 14 }}>
          {step === 'phone' ? (
            <View style={styles.input}>
              <Text style={styles.prefix}>+91</Text>
              <TextInput
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/\D/g, '').slice(0, 10));
                  setError(null);
                }}
                placeholder="98765 43210"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                autoFocus
                style={styles.inputText}
                onSubmitEditing={send}
              />
            </View>
          ) : (
            <>
              <TextInput
                value={code}
                onChangeText={(t) => {
                  setCode(t.replace(/\D/g, '').slice(0, 6));
                  setError(null);
                }}
                placeholder="------"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                autoFocus
                style={[styles.input, styles.inputText, styles.code]}
                onSubmitEditing={verify}
              />
              {devMode && <Text style={styles.hint}>Local test mode: the code is 123456</Text>}
            </>
          )}
          <ErrorText message={error} />
          <GreenButton
            label={step === 'phone' ? 'Send OTP' : 'Verify'}
            onPress={step === 'phone' ? send : verify}
            loading={loading}
          />
          {step === 'code' && (
            <Pressable onPress={() => setStep('phone')}>
              <Text style={styles.link}>Change number</Text>
            </Pressable>
          )}
        </Card>
        <Text style={styles.terms}>By continuing you agree to the terms and safety rules.</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { color: colors.white, fontSize: 24, fontWeight: '700' },
  body: { padding: 20, gap: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  h1: { fontSize: 26, fontWeight: '700', color: colors.text },
  sub: { fontSize: 15, color: colors.textMuted, marginBottom: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  prefix: { fontSize: 17, color: colors.text, marginRight: 8, fontWeight: '500' },
  inputText: { flex: 1, fontSize: 17, paddingVertical: 13, color: colors.text },
  code: { letterSpacing: 8, textAlign: 'center', flex: 0 },
  hint: { color: colors.green, fontSize: 13, textAlign: 'center' },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '500' },
  terms: { color: colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
