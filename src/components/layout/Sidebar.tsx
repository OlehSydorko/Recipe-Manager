'use client';

import { BookOpen, Home, Scroll, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/recipes', label: 'Recipes', icon: BookOpen },
    { href: '/collections', label: 'Collections', icon: Scroll },
     { href: '/people', label: 'Discover', icon: Search }
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className='hidden w-56 shrink-0 border-r border-border bg-bg-secondary px-3 py-6 sm:block'>
            <nav className='flex flex-col gap-1'>
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium transition-colors duration-150 ${
                                isActive
                                    ? 'bg-accent-muted text-accent'
                                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                            }`}
                        >
                            {isActive && (
                                <span className='absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent' />
                            )}
                            <Icon size={18} />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
