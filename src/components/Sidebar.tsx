'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    { href: '/', label: 'Home' },
    { href: '/recipes', label: 'Recipes' },
    { href: '/categories', label: 'Categories' }
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className='w-48 shrink-0 border-r px-4 py-6'>
            <nav className='flex flex-col gap-2'>
                {links.map((link) => {
                    const isActive = pathname === link.href;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`rounded px-2 py-1 text-sm ${
                                isActive ? 'bg-gray-200 font-medium text-gray-900' : ''
                            }`}
                        >
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
