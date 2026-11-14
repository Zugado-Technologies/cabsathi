import { CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteChrome';

export const metadata: Metadata = {
  title: 'Safety tips for sharing a cab',
  description:
    'How to share a cab safely with CabSathi: verified profiles, in-app chat, same-gender rides, sharing trip details with family, and how to report a problem.',
  alternates: { canonical: '/safety' },
};

const SECTIONS = [
  {
    title: 'Before the ride',
    items: [
      'Check your co-rider’s name, rating and number of past rides on their profile.',
      'Use “Same gender only” when you create a ride if you prefer.',
      'Agree on the pickup point and who books the cab in the CabSathi chat.',
      'Settle how you will pay your share before the ride starts.',
    ],
  },
  {
    title: 'During the ride',
    items: [
      'Share your live trip from the cab app with a friend or family member.',
      'Sit where you are comfortable and keep your phone charged.',
      'Do not share personal details such as your home address or ID with co-riders.',
    ],
  },
  {
    title: 'If something goes wrong',
    items: [
      'In an emergency, call 112.',
      'Report or block the person from their profile in CabSathi; our team reviews every report.',
      'Rate your co-rider honestly after the ride so others can decide.',
    ],
  },
];

export default function SafetyPage() {
  return (
    <>
      <SiteHeader>
        <div className="container" style={{ padding: '18px 0 26px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 800 }}>Safety tips for sharing a cab</h1>
          <p style={{ color: '#dbe6ff', fontSize: 17, marginTop: 10 }}>Simple habits that keep every shared ride comfortable.</p>
        </div>
      </SiteHeader>
      <main className="container section">
        <div className="grid">
          {SECTIONS.map((s) => (
            <section key={s.title} className="card stack">
              <h2 style={{ fontSize: 20, marginBottom: 0 }}>{s.title}</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {s.items.map((t) => (
                  <li key={t} style={{ display: 'flex', gap: 8, lineHeight: 1.5 }}>
                    <CircleCheck size={20} color="var(--green)" style={{ flexShrink: 0 }} />
                    {t}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
