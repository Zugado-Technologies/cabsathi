import type { Metadata } from 'next';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { SiteHeader } from '@/components/SiteChrome';
import { GENERAL_FAQ, faqJsonLd } from '@/lib/faq';

export const metadata: Metadata = {
  title: 'Frequently asked questions about cab sharing',
  description:
    'How CabSathi matches riders, how the fare is split, who books the cab, and how same-gender rides work. Answers to common questions about sharing a cab in Delhi NCR.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(GENERAL_FAQ)} />
      <SiteHeader>
        <div className="container" style={{ padding: '18px 0 26px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 40px)', fontWeight: 800 }}>Frequently asked questions</h1>
        </div>
      </SiteHeader>
      <main className="container section">
        <FaqList items={GENERAL_FAQ} />
      </main>
    </>
  );
}
