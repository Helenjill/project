'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/home', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/sell', label: 'Sell' },
  { href: '/likes', label: 'Likes' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/profile', label: 'Profile' }
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-gray-300 bg-white">
      <ul className="mx-auto grid max-w-3xl grid-cols-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`block border-r border-gray-200 px-2 py-3 text-center text-xs ${
                  active ? 'bg-tulane-green text-white' : 'text-gray-800'
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
