import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Brand, WaveHeader } from '@/components/WaveHeader';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Log in', robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <>
      <WaveHeader left={<Brand />} />
      <Suspense fallback={<div className="empty">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
