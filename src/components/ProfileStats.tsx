import { BookOpen, Heart, UserPlus, Users } from 'lucide-react';

type ProfileStatsProps = {
    recipesCount: number;
    favoritesCount: number;
    followersCount: number;
    followingCount: number;
    onRecipesClick?: () => void;
    onFavoritesClick?: () => void;
    onFollowersClick?: () => void;
    onFollowingClick?: () => void;
};

export function ProfileStats({
    recipesCount,
    favoritesCount,
    followersCount,
    followingCount,
    onRecipesClick,
    onFavoritesClick,
    onFollowersClick,
    onFollowingClick
}: ProfileStatsProps) {
    const items = [
        { icon: BookOpen, label: 'Recipes', onClick: onRecipesClick, value: recipesCount },
        { icon: Heart, label: 'Favorites', onClick: onFavoritesClick, value: favoritesCount },
        { icon: Users, label: 'Followers', onClick: onFollowersClick, value: followersCount },
        { icon: UserPlus, label: 'Following', onClick: onFollowingClick, value: followingCount }
    ];

    return (
        <div className='mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {items.map(({ icon: Icon, label, onClick, value }) => (
                <button
                    key={label}
                    type='button'
                    onClick={onClick}
                    disabled={!onClick}
                    className='rounded-lg border border-border bg-surface p-4 text-center transition-colors duration-150 enabled:hover:border-border-strong enabled:hover:bg-hover disabled:cursor-default'
                >
                    <Icon size={18} className='mx-auto text-accent' />
                    <p className='mt-2 text-h2 font-semibold text-text-primary'>{value}</p>
                    <p className='text-caption text-text-secondary'>{label}</p>
                </button>
            ))}
        </div>
    );
}
