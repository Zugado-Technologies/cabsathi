export interface Faq {
  q: string;
  a: string;
}

export const GENERAL_FAQ: Faq[] = [
  {
    q: 'What is CabSathi?',
    a: 'CabSathi helps people who are going the same way at the same time find each other, share one cab (Uber, Ola or any app cab) and split the fare. We connect riders; we do not run cabs or employ drivers.',
  },
  {
    q: 'How does CabSathi decide who is a match?',
    a: 'We check that you start close to each other, end close to each other, leave at a similar time, and that picking up the other person adds only a little extra travel for both of you. A big part of the trip must be shared. The allowed distance grows with the length of the trip, so short rides need closer matches.',
  },
  {
    q: 'How is the fare split?',
    a: 'Each stretch of the trip is split equally between the people in the cab at that time. If you ride alone for part of the trip, you pay for that part. Nobody is asked to pay more than their solo fare. The amounts shown are estimates until the cab app shows the final fare.',
  },
  {
    q: 'Who books the cab?',
    a: 'One of the matched riders books the cab in their usual app and the others pay their share to that person. You agree on this in the chat after a request is accepted.',
  },
  {
    q: 'Is CabSathi free?',
    a: 'Yes. Creating rides, finding matches and sending requests are free.',
  },
  {
    q: 'Can I choose to ride only with people of the same gender?',
    a: 'Yes. When you create a ride, choose “Same gender only” and you will only see and be seen by people of the same gender.',
  },
  {
    q: 'Which cities does CabSathi cover?',
    a: 'We are starting with Delhi NCR: Delhi, Noida, Greater Noida, Ghaziabad, Gurgaon and Faridabad.',
  },
];

/** JSON-LD for a FAQ page, so search engines can show the answers. */
export function faqJsonLd(items: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
