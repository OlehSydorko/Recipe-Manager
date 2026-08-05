'use client';

import { useAvatarUrl, useCurrentProfile } from '@/hooks/useProfile';
import { ChefHat, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [{ href: '/profile', label: 'Profile', icon: User }];

export function Nav() {
    const pathname = usePathname();
    const { data: profile } = useCurrentProfile();
    const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);

    return (
        <header className='sticky top-0 z-30 border-b border-border bg-bg-secondary'>
            <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6'>
                <ChefHat size={33} className='text-accent' />
                <Link href='/' className='shrink-0 text-h3 font-semibold text-text-primary'>
                    Recipe Manager
                </Link>

                <div className='ml-auto shrink-0'>
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
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={avatarUrl}
                                        alt={profile?.display_name ?? 'Profile'}
                                        className='h-7 w-7 shrink-0 rounded-full object-cover'
                                    />
                                ) : (
                                    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-bg-secondary'>
                                        <Icon size={16} />
                                    </span>
                                )}
                                {profile?.display_name || link.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </header>
    );
}
