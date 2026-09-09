'use client';

import { useState } from 'react';
import { GlobalSearch } from '@/features/search/components/GlobalSearch/GlobalSearch';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useAvatarUrl, useCurrentProfile } from '@/hooks/useProfile';
import { ChefHat, LogIn, Search, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Nav.module.scss';

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
            <header className={styles.header}>
                <div className={styles.container}>
                    <ChefHat size={33} className='text-accent' />
                    <Link href='/' aria-label='Recipe Manager home' className={styles.logo}>
                        <span className='hidden sm:inline'>Recipe Manager</span>
                    </Link>

                    <div className={`${styles.skeletonPill} animate-pulse`} />
                </div>
            </header>
        );
    }

    if (isGuest) {
        return (
            <header className={styles.header}>
                <div className={styles.container}>
                    <ChefHat size={33} className='text-accent' />
                    <Link href='/' aria-label='Recipe Manager home' className={styles.logo}>
                        <span className='hidden sm:inline'>Recipe Manager</span>
                    </Link>

                    <GlobalSearch className='hidden flex-1 sm:block' />

                    <div className='ml-auto flex shrink-0 items-center gap-2'>
                        <button
                            type='button'
                            onClick={() => setIsMobileSearchOpen((open) => !open)}
                            aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
                            className={styles.searchToggle}
                        >
                            {isMobileSearchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>

                        <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} className={styles.signInLink}>
                            <LogIn size={16} />
                            Sign In
                        </Link>
                    </div>
                </div>

                {isMobileSearchOpen && (
                    <div className={styles.mobileSearchPanel}>
                        <GlobalSearch autoFocus onNavigate={() => setIsMobileSearchOpen(false)} />
                    </div>
                )}
            </header>
        );
    }

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <ChefHat size={33} className='text-accent' />
                <Link href='/' aria-label='Recipe Manager home' className={styles.logo}>
                    <span className='hidden sm:inline'>Recipe Manager</span>
                </Link>

                <GlobalSearch className='hidden flex-1 sm:block' />

                <div className='ml-auto flex shrink-0 items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setIsMobileSearchOpen((open) => !open)}
                        aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
                        className={styles.searchToggle}
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
                                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                            >
                                {isActive && <span className={styles.activeIndicator} />}
                                {avatarUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={avatarUrl}
                                        alt={profile?.display_name ?? 'Profile'}
                                        className='h-7 w-7 shrink-0 rounded-full object-cover'
                                    />
                                ) : (
                                    <span className={styles.avatarFallback}>
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
                <div className={styles.mobileSearchPanel}>
                    <GlobalSearch autoFocus onNavigate={() => setIsMobileSearchOpen(false)} />
                </div>
            )}
        </header>
    );
}
