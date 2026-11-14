'use client';

import { Bell, ChevronDown, CircleCheck, MapPin, Megaphone, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brand, WaveHeader } from '@/components/WaveHeader';
import { greeting } from '@/lib/format';
import { useSession } from '@/lib/session';

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
    try {
      if (localStorage.getItem(TIPS_KEY) === '1') setShowTips(false);
    } catch {}
  }, []);

  const firstName = user?.name?.split(' ')[0];

  return (
    <>
      <WaveHeader
        left={
          <Link href="/" aria-label="CabSathi website">
            <Brand />
          </Link>
        }
        right={
          <button type="button" className="icon-btn" aria-label="Notifications">
            <Bell size={26} fill="#fff" />
            <span className="badge">3</span>
          </button>
        }
      />
      <div className="app-body">
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>
            {greeting()}
            {firstName ? `, ${firstName}!` : '!'}
          </h2>
          <button type="button" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 16 }}>
            <MapPin size={18} color="var(--primary-dark)" fill="var(--primary-dark)" fillOpacity={0.15} />
            Delhi NCR
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="home-panel">
          <Link href="/create-ride" className="btn-green">
            <Plus size={26} strokeWidth={3} /> Create Ride
          </Link>
          {showTips && (
            <section className="tips" aria-label="Tips">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: 'var(--orange)', display: 'inline-block' }} />
                <h3 style={{ fontSize: 17 }}>Tips</h3>
              </div>
              <ul>
                {TIPS.map((t) => (
                  <li key={t}>
                    <CircleCheck size={20} color="#fff" fill="var(--green)" style={{ flexShrink: 0 }} />
                    {t}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn-blue"
                style={{ alignSelf: 'flex-end' }}
                onClick={() => {
                  setShowTips(false);
                  try {
                    localStorage.setItem(TIPS_KEY, '1');
                  } catch {}
                }}
              >
                Got it
              </button>
            </section>
          )}
        </div>

        <aside className="ad" aria-label="Advertisement">
          <span className="tag">Ad</span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h3>
              Advertise Your
              <br />
              Business Here
            </h3>
            <p style={{ fontSize: 13, color: '#dbeafe' }}>Boost your local presence with us</p>
            <button type="button" className="btn-green sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
              Get Started
            </button>
          </div>
          <Megaphone size={64} color="#dbeafe" />
        </aside>
      </div>
    </>
  );
}
