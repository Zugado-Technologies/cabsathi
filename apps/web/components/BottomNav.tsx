'use client';

import { Car, House, MessageSquareMore, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/home', label: 'Home', Icon: House, match: ['/home', '/create-ride'] },
  { href: '/rides', label: 'Rides', Icon: Car, match: ['/rides', '/matches'] },
  { href: '/messages', label: 'Messages', Icon: MessageSquareMore, match: ['/messages'] },
  { href: '/profile', label: 'Profile', Icon: User, match: ['/profile'] },
];

/** The 4-tab bottom bar from the mockup. */
export function BottomNav() {
  return <BottomNavBar path={usePathname()} />;
}

/** Same bar with no tab highlighted; shown while the URL is not known yet. */
export function BottomNavBar({ path }: { path: string }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="inner">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = match.some((m) => path.startsWith(m));
          return (
            <Link key={href} href={href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              <Icon size={24} fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
