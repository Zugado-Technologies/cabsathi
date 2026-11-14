'use client';

import { phoneSchema } from '@cabsathi/shared';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

/** Only allow going back to a page on this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/home');

export function LoginForm() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { ready, user, signIn } = useSession();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [devMode, setDevMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return setError(parsed.error.issues[0]!.message);
    setError(null);
    setLoading(true);
    try {
      setDevMode((await api.sendOtp(phone)).devMode);
      setStep('code');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code');
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(phone, code);
      signIn(res.token, res.user);
      router.replace(next);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <div className="app-body" style={{ maxWidth: 480 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>{step === 'phone' ? 'Welcome' : 'Enter the code'}</h1>
      <p className="muted" style={{ fontSize: 15 }}>
        {step === 'phone'
          ? 'Share your cab with people going your way and split the fare.'
          : `We sent a 6-digit code to +91 ${phone}.`}
      </p>
      <form className="card stack" style={{ gap: 14 }} onSubmit={step === 'phone' ? send : verify} noValidate>
        {step === 'phone' ? (
          <label className="field">
            <span style={{ fontWeight: 700 }}>+91</span>
            <input
              aria-label="Mobile number"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                setError(null);
              }}
            />
          </label>
        ) : (
          <>
            <label className="field">
              <input
                aria-label="One-time code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="------"
                style={{ textAlign: 'center', letterSpacing: 8 }}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  setError(null);
                }}
              />
            </label>
            {devMode && (
              <p className="ok" style={{ textAlign: 'center' }}>
                Local test mode: the code is 123456
              </p>
            )}
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-green" disabled={loading}>
          {loading ? 'Please wait…' : step === 'phone' ? 'Send OTP' : 'Verify'}
        </button>
        {step === 'code' && (
          <button type="button" style={{ color: 'var(--primary)', fontWeight: 700 }} onClick={() => setStep('phone')}>
            Change number
          </button>
        )}
      </form>
      <p className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
        By continuing you agree to the terms and safety rules.
      </p>
    </div>
  );
}
