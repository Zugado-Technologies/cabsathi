import { CircleCheck, MessageCircle, Route, ShieldCheck, Users, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { SiteHeader } from '@/components/SiteChrome';
import { Avatar, Stars } from '@/components/ui';
import { GENERAL_FAQ, faqJsonLd } from '@/lib/faq';
import { ROUTES } from '@/lib/routes';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'CabSathi – Share a cab in Delhi NCR and split the fare' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
};

const STEPS = [
  { icon: Route, title: 'Create a ride', body: 'Enter where you start, where you are going and when you leave.' },
  { icon: Users, title: 'See who matches', body: 'We show people starting and ending near you at a similar time, with how much of the trip you share.' },
  { icon: MessageCircle, title: 'Request and plan', body: 'Send a request. Once it is accepted, agree on the pickup point and who books the cab.' },
  { icon: Wallet, title: 'Ride and split', body: 'Share one cab and split the fare by who rode which part of the trip.' },
];

export default function Landing() {
  const featured = ROUTES[0];
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
          description: SITE_DESCRIPTION,
        }}
      />
      <JsonLd data={faqJsonLd(GENERAL_FAQ.slice(0, 4))} />
      <SiteHeader>
        <div className="container hero" style={{ padding: undefined }}>
          <div>
            <h1>Going the same way? Share the cab, split the fare.</h1>
            <p className="lead" style={{ color: '#dbe6ff' }}>
              CabSathi finds people in Delhi NCR who start near you, end near you and leave around the same time, so
              you can share one Uber or Ola and pay less.
            </p>
            <div className="actions">
              <Link href="/create-ride" className="btn-green">
                Create Ride
              </Link>
              <Link href="#how" className="btn-outline" style={{ color: '#fff', background: 'transparent', padding: '12px 20px', borderRadius: 999 }}>
                How it works
              </Link>
            </div>
          </div>
          <div className="phone-preview" aria-hidden="true">
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text)' }}>
              <div style={{ fontWeight: 800 }}>Matching Rides</div>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{featured.from}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Approx {featured.distanceKm} km · Tomorrow 10:30 AM · 1 Seat
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                  <Avatar name="Nikita" size={36} verified />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>Nikita 26</div>
                    <Stars rating={4.5} />
                  </div>
                  <div style={{ fontSize: 12, textAlign: 'right' }}>
                    1.2 km away
                    <br />
                    <span className="muted">3 mins to meet</span>
                  </div>
                </div>
                <div style={{ marginTop: 10, color: 'var(--green)', fontWeight: 800, fontSize: 20 }}>
                  ₹{featured.sharedFareEach - 10} - ₹{featured.sharedFareEach + 15}{' '}
                  <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                    per person
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SiteHeader>

      <main>
        <section id="how" className="section container">
          <h2>How CabSathi works</h2>
          <p className="sub">Four steps from “I’m going this way” to a shared cab.</p>
          <div className="grid">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="card stack">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="step-num">{i + 1}</span>
                  <Icon size={22} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: 17 }}>{title}</h3>
                <p className="muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="routes" className="section container">
          <h2>Popular cab-sharing routes in Delhi NCR</h2>
          <p className="sub">Typical distance and what you could pay when two people share.</p>
          <div className="grid">
            {ROUTES.map((r) => (
              <Link key={r.slug} href={`/cab-sharing/${r.slug}`} className="card route-card">
                <h3>
                  {r.fromArea} to {r.toArea}
                </h3>
                <span className="muted" style={{ fontSize: 14 }}>
                  ~{r.distanceKm} km · ~{r.minutes} min
                </span>
                <span style={{ fontSize: 14 }}>
                  Solo ~₹{r.soloFare} · <b style={{ color: 'var(--green)' }}>Shared ~₹{r.sharedFareEach} each</b>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section container">
          <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', background: 'var(--tips-bg)', borderColor: 'var(--tips-border)' }}>
            <ShieldCheck size={32} color="var(--green)" style={{ flexShrink: 0 }} />
            <div className="stack">
              <h2 style={{ marginBottom: 0 }}>Safety first</h2>
              <ul className="prose" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {[
                  'Phone-verified accounts and ratings after every ride.',
                  'Chat inside CabSathi, so you never have to share your number.',
                  'Same-gender option, plus report and block on every profile.',
                ].map((t) => (
                  <li key={t} style={{ display: 'flex', gap: 8 }}>
                    <CircleCheck size={20} color="var(--green)" style={{ flexShrink: 0 }} />
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/safety" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                Read our safety guide →
              </Link>
            </div>
          </div>
        </section>

        <section className="section container">
          <h2>Questions people ask</h2>
          <p className="sub">
            More in the <Link href="/faq" style={{ color: 'var(--primary)', fontWeight: 700 }}>full FAQ</Link>.
          </p>
          <FaqList items={GENERAL_FAQ.slice(0, 4)} />
        </section>
      </main>
    </>
  );
}
