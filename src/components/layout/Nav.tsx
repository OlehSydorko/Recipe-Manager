'use client';

import { useState } from 'react';
import { GlobalSearch } from '@/features/search/components/GlobalSearch';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useAvatarUrl, useCurrentProfile } from '@/hooks/useProfile';
import { ChefHat, LogIn, Search, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [{ href: '/profile', label: 'Profile', icon: User }];

export function Nav() {
    const pathname = usePathname();
    const hasMounted = useHasMounted();
    const { data: profile, isPending: profilePending } = useCurrentProfile();
    const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);
    const isGuest = hasMounted && !profilePending && !profile;
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    if (!hasMounted || profilePending) {
        return (
            <header className='sticky top-0 z-30 border-b border-border bg-bg-secondary'>
                <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6'>
                    <ChefHat size={33} className='text-accent' />
                    <Link href='/' aria-label='Recipe Manager home' className='shrink-0 text-h3 font-semibold text-text-primary'>
                        <span className='hidden sm:inline'>Recipe Manager</span>
                    </Link>

                    <div className='ml-auto h-10 w-24 shrink-0 animate-pulse rounded-md bg-hover' />
                </div>
            </header>
        );
    }

    if (isGuest) {
        return (
            <header className='sticky top-0 z-30 border-b border-border bg-bg-secondary'>
                <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6'>
                    <ChefHat size={33} className='text-accent' />
                    <Link href='/' aria-label='Recipe Manager home' className='shrink-0 text-h3 font-semibold text-text-primary'>
                        <span className='hidden sm:inline'>Recipe Manager</span>
                    </Link>

                    <GlobalSearch className='hidden flex-1 sm:block' />

                    <div className='ml-auto flex shrink-0 items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setIsMobileSearchOpen((open) => !open)}
                            aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
                            className='flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-hover hover:text-text-primary sm:hidden'
                        >
                            {isMobileSearchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>

                        <Link
                            href={`/login?redirect=${encodeURIComponent(pathname)}`}
                            className='flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                        >
                            <LogIn size={16} />
                            Sign In
                        </Link>
                    </div>
                </div>

                {isMobileSearchOpen && (
                    <div className='border-t border-border bg-bg-secondary px-4 py-3 sm:hidden'>
                        <GlobalSearch autoFocus onNavigate={() => setIsMobileSearchOpen(false)} />
                    </div>
                )}
            </header>
        );
    }

    return (
        <header className='sticky top-0 z-30 border-b border-border bg-bg-secondary'>
            <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6'>
                <ChefHat size={33} className='text-accent' />
                <Link href='/' aria-label='Recipe Manager home' className='shrink-0 text-h3 font-semibold text-text-primary'>
                    <span className='hidden sm:inline'>Recipe Manager</span>
                </Link>

                <GlobalSearch className='hidden flex-1 sm:block' />

                <div className='ml-auto flex shrink-0 items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setIsMobileSearchOpen((open) => !open)}
                        aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
                        className='flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors duration-150 hover:bg-hover hover:text-text-primary sm:hidden'
                    >
                        {isMobileSearchOpen ? <X size={20} /> : <Search size={20} />}
                    </button>

                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-label={profile?.display_name || link.label}
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
                                <span className='hidden sm:inline'>{profile?.display_name || link.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {isMobileSearchOpen && (
                <div className='border-t border-border bg-bg-secondary px-4 py-3 sm:hidden'>
                    <GlobalSearch autoFocus onNavigate={() => setIsMobileSearchOpen(false)} />
                </div>
            )}
        </header>
    );
}
