import { BookOpen, Heart, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';

type HomeStatsProps = {
    recipesCount: number;
    favoritesCount: number;
    followersCount: number;
    followingCount: number;
};

export function HomeStats({ recipesCount, favoritesCount, followersCount, followingCount }: HomeStatsProps) {
    const items = [
        { href: '/recipes', icon: BookOpen, label: 'Recipes', value: recipesCount },
        { href: '/recipes', icon: Heart, label: 'Favorites', value: favoritesCount },
        { href: '/profile', icon: Users, label: 'Followers', value: followersCount },
        { href: '/profile', icon: UserPlus, label: 'Following', value: followingCount }
    ];

    return (
        <>
            {/* Desktop/tablet: the original boxed stat-card grid. */}
            <div className='hidden gap-3 sm:grid sm:grid-cols-4'>
                {items.map(({ href, icon: Icon, label, value }) => (
                    <Link
                        key={label}
                        href={href}
                        className='rounded-lg border border-border bg-surface p-4 text-center transition-colors duration-150 hover:border-border-strong hover:bg-hover'
                    >
                        <Icon size={18} className='mx-auto text-accent' />
                        <p className='mt-2 text-h2 font-semibold text-text-primary'>{value}</p>
                        <p className='text-caption text-text-secondary'>{label}</p>
                    </Link>
                ))}
            </div>

            {/* Mobile: a slimmer, less prominent single-row strip. */}
            <div className='flex divide-x divide-border rounded-lg border border-border sm:hidden'>
                {items.map(({ href, icon: Icon, label, value }) => (
                    <Link
                        key={label}
                        href={href}
                        className='flex flex-1 flex-col items-center gap-0.5 py-2.5 text-center transition-colors duration-150 hover:bg-hover'
                    >
                        <Icon size={14} className='text-accent' />
                        <p className='text-label font-semibold text-text-primary'>{value}</p>
                        <p className='text-caption text-text-secondary'>{label}</p>
                    </Link>
                ))}
            </div>
        </>
    );
}
