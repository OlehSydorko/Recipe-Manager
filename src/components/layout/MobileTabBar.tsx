'use client';

import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { BookOpen, Home, LogIn, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LOGGED_IN_LINKS = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/recipes', label: 'Recipes', icon: BookOpen },
    { href: '/profile', label: 'Profile', icon: User }
];

export function MobileTabBar() {
    const pathname = usePathname();
    const hasMounted = useHasMounted();
    const { data: profile, isPending: profilePending } = useCurrentProfile();
    // hasMounted-gated so the client's first paint always matches the
    // server (which never resolves this) -- see useHasMounted for why.
    const isGuest = hasMounted && !profilePending && !profile;

    const links = isGuest
        ? [
              { href: '/', label: 'Home', icon: Home },
              { href: '/recipes', label: 'Recipes', icon: BookOpen },
              { href: `/login?redirect=${encodeURIComponent(pathname)}`, label: 'Sign In', icon: LogIn }
          ]
        : LOGGED_IN_LINKS;

    return (
        <nav className='fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-bg-secondary px-2 py-1.5 sm:hidden'>
            {links.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-1 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-caption transition-colors duration-150 ${
                            isActive ? 'text-accent' : 'text-text-secondary'
                        }`}
                    >
                        <Icon size={20} />
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
