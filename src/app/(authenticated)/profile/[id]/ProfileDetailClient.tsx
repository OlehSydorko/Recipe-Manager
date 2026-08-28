'use client';

import { useEffect } from 'react';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { CollectionCard } from '@/features/collections/components/CollectionCard';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { FollowButton } from '@/features/social/components/FollowButton';
import { usePublicCollectionsByUser } from '@/hooks/useCollections';
import { useFollowCounts } from '@/hooks/useFollows';
import { useAvatarUrl, useCurrentProfile, useProfile } from '@/hooks/useProfile';
import { useRecipesByUser } from '@/hooks/useRecipes';
import { BookOpen, MapPin, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ProfileDetailClientProps = {
    id: string;
};

export function ProfileDetailClient({ id }: ProfileDetailClientProps) {
    const router = useRouter();
    const { data: currentProfile } = useCurrentProfile();
    const { data: profile, isPending, isError } = useProfile(id);
    const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url);
    const { data: followCounts } = useFollowCounts(id);
    const { data: recipes, isPending: recipesPending } = useRecipesByUser(id);
    const { data: publicCollections, isPending: collectionsPending } = usePublicCollectionsByUser(id);

    useEffect(() => {
        if (currentProfile && currentProfile.id === id) {
            router.replace('/profile');
        }
    }, [currentProfile, id, router]);

    if (isPending) {
        return <p className='text-body text-text-secondary'>Loading…</p>;
    }

    if (isError || !profile) {
        return <p className='text-body text-error'>Profile not found.</p>;
    }

    return (
        <div>
            <div className='flex flex-col gap-5 sm:flex-row sm:items-start'>
                <div className='flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-secondary'>
                    {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={avatarUrl}
                            alt={profile.display_name ?? 'Profile photo'}
                            className='h-full w-full object-cover'
                        />
                    ) : (
                        <User size={28} className='text-text-disabled' />
                    )}
                </div>

                <div className='min-w-0 flex-1'>
                    <h1 className='text-display font-semibold text-text-primary'>
                        {profile.display_name || 'Unnamed'}
                    </h1>

                    {profile.tagline && <p className='mt-0.5 text-body text-text-secondary'>{profile.tagline}</p>}

                    {profile.location && (
                        <p className='mt-1.5 flex items-center gap-1 text-caption text-text-secondary'>
                            <MapPin size={14} />
                            {profile.location}
                        </p>
                    )}

                    {profile.bio && <p className='mt-3 max-w-xl text-body text-text-secondary'>{profile.bio}</p>}

                    <div className='mt-4'>
                        <FollowButton userId={profile.id} />
                    </div>
                </div>
            </div>

            <div className='mt-6 grid grid-cols-2 gap-3 sm:w-64'>
                <div className='rounded-lg border border-border bg-surface p-4 text-center'>
                    <p className='text-h2 font-semibold text-text-primary'>{followCounts?.followers ?? 0}</p>
                    <p className='text-caption text-text-secondary'>Followers</p>
                </div>
                <div className='rounded-lg border border-border bg-surface p-4 text-center'>
                    <p className='text-h2 font-semibold text-text-primary'>{followCounts?.following ?? 0}</p>
                    <p className='text-caption text-text-secondary'>Following</p>
                </div>
            </div>

            <div className='mt-8'>
                <h2 className='text-h2 font-semibold text-text-primary'>Recipes</h2>

                {recipesPending && (
                    <div className='mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                        {Array.from({ length: 3 }).map((_, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <RecipeCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {!recipesPending && recipes?.length === 0 && (
                    <div className='mt-10 flex flex-col items-center gap-3 text-center'>
                        <BookOpen size={32} className='text-text-disabled' />
                        <p className='text-h3 font-medium text-text-primary'>No recipes yet</p>
                    </div>
                )}

                {!recipesPending && recipes && recipes.length > 0 && (
                    <div className='mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                        {recipes.map((recipe) => (
                            <RecipeCard key={recipe.id} recipe={recipe} categoryName={recipe.categoryName ?? 'Uncategorized'} />
                        ))}
                    </div>
                )}
            </div>

            {!collectionsPending && publicCollections && publicCollections.length > 0 && (
                <div className='mt-8'>
                    <h2 className='text-h2 font-semibold text-text-primary'>Collections</h2>

                    <div className='mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {publicCollections.map((collection) => (
                            <CollectionCard
                                key={collection.id}
                                collection={collection}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                hideActions
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
