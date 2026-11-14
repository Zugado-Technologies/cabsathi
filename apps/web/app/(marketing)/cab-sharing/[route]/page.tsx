import { CircleCheck, Clock, IndianRupee, MapPin, Route as RouteIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { SiteHeader } from '@/components/SiteChrome';
import { faqJsonLd, type Faq } from '@/lib/faq';
import { ROUTES, getRoute, type RoutePage } from '@/lib/routes';
import { SITE_URL } from '@/lib/site';

type Props = { params: Promise<{ route: string }> };

/** Every route page is prerendered from the list below; unknown slugs return a real 404. */
export const instant = false;

export function generateStaticParams() {
  return ROUTES.map((r) => ({ route: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = getRoute((await params).route);
  if (!r) return {};
  const title = `${r.fromArea} to ${r.toArea} cab sharing – split the fare`;
  const description = `Share a cab from ${r.fromArea} to ${r.toArea} (${r.from} to ${r.to}). About ${r.distanceKm} km; solo around ₹${r.soloFare}, about ₹${r.sharedFareEach} each when two people share. Find people going your way on CabSathi.`;
  return {
    title,
    description,
    alternates: { canonical: `/cab-sharing/${r.slug}` },
    openGraph: { title, description, url: `/cab-sharing/${r.slug}` },
  };
}

function routeFaq(r: RoutePage): Faq[] {
  return [
    {
      q: `How much does a shared cab from ${r.fromArea} to ${r.toArea} cost?`,
      a: `A solo app cab from ${r.from} to ${r.to} is roughly ₹${r.soloFare}. When two people share most of the trip, each pays about ₹${r.sharedFareEach}, a saving of around ${r.savingPct}%. These are estimates; the cab app shows the final fare.`,
    },
    {
      q: `How long does ${r.fromArea} to ${r.toArea} take?`,
      a: `The trip is about ${r.distanceKm} km and usually takes around ${r.minutes} minutes, depending on traffic and the time of day.`,
    },
    {
      q: `Where can I be picked up for a ${r.fromArea} to ${r.toArea} shared cab?`,
      a: `Riders often start from ${[r.from, ...r.pickupsNear].join(', ')}. CabSathi matches you with people who start close to you, so the cab doesn't have to go far out of its way.`,
    },
    {
      q: 'How close does my co-rider have to be?',
      a: `For a trip of about ${r.distanceKm} km, co-riders usually start within about ${Math.max(1.5, Math.min(10, r.distanceKm * 0.12)).toFixed(1)} km of you and end within about ${Math.max(2, Math.min(12, r.distanceKm * 0.15)).toFixed(1)} km. We also check that picking each other up adds only a little extra travel.`,
    },
  ];
}

export default async function RoutePageView({ params }: Props) {
  const r = getRoute((await params).route);
  if (!r) notFound();
  const faq = routeFaq(r);
  const others = ROUTES.filter((x) => x.slug !== r.slug).slice(0, 6);

  return (
    <>
      <JsonLd data={faqJsonLd(faq)} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'CabSathi', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Routes', item: `${SITE_URL}/#routes` },
            {
              '@type': 'ListItem',
              position: 3,
              name: `${r.fromArea} to ${r.toArea}`,
              item: `${SITE_URL}/cab-sharing/${r.slug}`,
            },
          ],
        }}
      />
      <SiteHeader>
        <div className="container" style={{ padding: '18px 0 26px' }}>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>/<Link href="/#routes">Routes</Link>/
            <span>
              {r.fromArea} to {r.toArea}
            </span>
          </nav>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, marginTop: 10, lineHeight: 1.15 }}>
            {r.fromArea} to {r.toArea} cab sharing
          </h1>
          <p style={{ color: '#dbe6ff', fontSize: 17, marginTop: 10, maxWidth: 680, lineHeight: 1.5 }}>
            Share one cab from {r.from} to {r.to} with someone leaving around the same time, and split the fare.
          </p>
        </div>
      </SiteHeader>

      <main className="container">
        <section className="section" style={{ paddingTop: 12 }}>
          <div className="stats">
            <div className="stat">
              <div className="k">
                <RouteIcon size={14} /> Distance
              </div>
              <div className="v">~{r.distanceKm} km</div>
            </div>
            <div className="stat">
              <div className="k">
                <Clock size={14} /> Usual time
              </div>
              <div className="v">~{r.minutes} min</div>
            </div>
            <div className="stat">
              <div className="k">
                <IndianRupee size={14} /> Solo cab
              </div>
              <div className="v">~₹{r.soloFare}</div>
            </div>
            <div className="stat">
              <div className="k">
                <IndianRupee size={14} /> Shared, each
              </div>
              <div className="v green">~₹{r.sharedFareEach}</div>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
            Estimates for two people sharing most of the trip. The cab app shows the final fare.
          </p>
        </section>

        <section className="section prose" style={{ paddingTop: 0 }}>
          <h2>About this route</h2>
          <p>{r.blurb}</p>
          <div className="grid" style={{ marginTop: 18 }}>
            <div className="card stack">
              <h3 style={{ fontSize: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={18} color="var(--red)" /> Common pickup points
              </h3>
              <ul>
                {[r.from, ...r.pickupsNear].map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="card stack">
              <h3 style={{ fontSize: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={18} color="var(--green)" /> Common drop points
              </h3>
              <ul>
                {[r.to, ...r.dropsNear].map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="card stack" style={{ background: '#eef3fb' }}>
            <h2 style={{ marginBottom: 0 }}>Going from {r.fromArea} to {r.toArea}?</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {[
                'Create your ride with your start, destination and time.',
                'See people leaving near you within the matching window.',
                'Send a request, agree on pickup in chat, and share the cab.',
              ].map((t) => (
                <li key={t} style={{ display: 'flex', gap: 8 }}>
                  <CircleCheck size={20} color="var(--green)" style={{ flexShrink: 0 }} />
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/create-ride" className="btn-green" style={{ maxWidth: 320 }}>
              Create Ride
            </Link>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <h2>
            {r.fromArea} to {r.toArea}: common questions
          </h2>
          <FaqList items={faq} />
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <h2>Other routes</h2>
          <div className="grid">
            {others.map((o) => (
              <Link key={o.slug} href={`/cab-sharing/${o.slug}`} className="card route-card">
                <h3>
                  {o.fromArea} to {o.toArea}
                </h3>
                <span className="muted" style={{ fontSize: 14 }}>
                  ~{o.distanceKm} km · shared ~₹{o.sharedFareEach} each
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
