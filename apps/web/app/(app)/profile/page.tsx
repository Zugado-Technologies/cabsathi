'use client';

import type { Gender } from '@cabsathi/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, Stars } from '@/components/ui';
import { WaveHeader } from '@/components/WaveHeader';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';

export default function Profile() {
  const router = useRouter();
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
      setUser(
        await api.updateMe({
          name: name.trim() || undefined,
          gender: gender || undefined,
          birthYear: birthYear ? Number(birthYear) : undefined,
        }),
      );
      setMessage('Profile saved');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <WaveHeader title="Profile" />
      <div className="app-body">
        <section className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={user.name} size={64} verified={user.verified} />
          <div className="stack" style={{ gap: 4 }}>
            <b style={{ fontSize: 20 }}>{user.name ?? 'Add your name'}</b>
            <span className="muted">+91 {user.phone}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Stars rating={user.rating} />
              <span className="muted" style={{ fontSize: 14 }}>
                {user.rating.toFixed(1)} · {user.ridesCount} rides
              </span>
            </span>
          </div>
        </section>

        <section className="card stack">
          <label className="stack" style={{ gap: 6 }}>
            <b style={{ fontSize: 14 }}>Name</b>
            <span className="field">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </span>
          </label>
          <div className="stack" style={{ gap: 6 }}>
            <b style={{ fontSize: 14 }}>Gender</b>
            <div className="segment" role="radiogroup" aria-label="Gender">
              {(['male', 'female', 'other'] as const).map((g) => (
                <button key={g} type="button" role="radio" aria-checked={gender === g} className={gender === g ? 'on' : ''} onClick={() => setGender(g)}>
                  {g[0].toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <label className="stack" style={{ gap: 6 }}>
            <b style={{ fontSize: 14 }}>Birth year</b>
            <span className="field">
              <input
                value={birthYear}
                inputMode="numeric"
                placeholder="1998"
                onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </span>
          </label>
          {error && <p className="error">{error}</p>}
          {message && <p className="ok">{message}</p>}
          <button type="button" className="btn-green sm" style={{ alignSelf: 'flex-start' }} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </section>

        <button
          type="button"
          style={{ color: 'var(--red)', fontWeight: 700, padding: 14 }}
          onClick={() => {
            signOut();
            router.replace('/login');
          }}
        >
          Log out
        </button>
      </div>
    </>
  );
}
