'use client';

import { useMemo } from 'react';
import { HomeCollectionCard } from '@/features/home/components/HomeCollectionCard';
import { HomeGreeting } from '@/features/home/components/HomeGreeting';
import { HomeRecipeSection } from '@/features/home/components/HomeRecipeSection';
import { HomeStats } from '@/features/home/components/HomeStats';
import { useCategories } from '@/hooks/useCategories';
import { useCollections } from '@/hooks/useCollections';
import { useFollowCounts } from '@/hooks/useFollows';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useCommunityRecipes, useRecipes } from '@/hooks/useRecipes';
import Link from 'next/link';

const RECENT_RECIPES_LIMIT = 4;
const COLLECTIONS_LIMIT = 4;

export default function HomePage() {
    const hasMounted = useHasMounted();
    const { data: profile, isPending: profilePending } = useCurrentProfile();
    const isGuest = hasMounted && !profilePending && !profile;

    const { data: recipes, isPending: recipesPending, isError: recipesError } = useRecipes();
    const {
        data: communityRecipes,
        isPending: communityPending,
        isError: communityError
    } = useCommunityRecipes();
    const { data: categories } = useCategories();
    const { data: collections, isPending: collectionsPending } = useCollections();
    const { data: followCounts } = useFollowCounts(profile?.id ?? null);

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    const recentRecipes = useMemo(
        () =>
            [...(recipes ?? [])]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, RECENT_RECIPES_LIMIT),
        [recipes]
    );

    const recentCommunityRecipes = useMemo(
        () =>
            [...(communityRecipes ?? [])]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .slice(0, RECENT_RECIPES_LIMIT),
        [communityRecipes]
    );

    const favoritesCount = recipes?.filter((recipe) => recipe.is_favorite).length ?? 0;
    const topCollections = collections?.slice(0, COLLECTIONS_LIMIT) ?? [];
    const hasCollections = !collectionsPending && topCollections.length > 0;

    return (
        <div className='space-y-10'>
            <HomeGreeting displayName={profile?.display_name ?? null} />

            {isGuest ? (
                <div className='rounded-lg border border-border bg-surface p-5'>
                    <p className='text-body text-text-secondary'>
                        Browsing as a guest.{' '}
                        <Link href='/login' className='font-medium text-accent hover:text-accent-hover'>
                            Sign in
                        </Link>{' '}
                        to save your own recipes, follow other cooks, and build collections.
                    </p>
                </div>
            ) : (
                <HomeStats
                    recipesCount={recipes?.length ?? 0}
                    favoritesCount={favoritesCount}
                    followersCount={followCounts?.followers ?? 0}
                    followingCount={followCounts?.following ?? 0}
                />
            )}

            {isGuest ? (
                <HomeRecipeSection
                    title='From the community'
                    viewAllHref='/recipes'
                    recipes={recentCommunityRecipes}
                    isPending={communityPending}
                    isError={communityError}
                    skeletonCount={RECENT_RECIPES_LIMIT}
                    emptyTitle='No recipes yet'
                    emptyDescription='Check back soon.'
                />
            ) : (
                <>
                    <HomeRecipeSection
                        title='Community Recipes'
                        viewAllHref='/recipes?tab=community'
                        recipes={recentCommunityRecipes}
                        isPending={communityPending}
                        isError={communityError}
                        skeletonCount={RECENT_RECIPES_LIMIT}
                        emptyTitle='No community recipes yet'
                        emptyDescription='Recipes from other users will show up here.'
                    />

                    <HomeRecipeSection
                        title='Recently added'
                        viewAllHref='/recipes'
                        recipes={recentRecipes}
                        isPending={recipesPending}
                        isError={recipesError}
                        skeletonCount={RECENT_RECIPES_LIMIT}
                        emptyTitle='No recipes yet'
                        emptyDescription='Create your first recipe to get started.'
                        categoryNameById={categoryNameById}
                        emptyAction={
                            <Link
                                href='/recipes/new'
                                className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                            >
                                Create recipe
                            </Link>
                        }
                    />
                </>
            )}

            {!isGuest && hasCollections && (
                <section>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-h2 font-semibold text-text-primary'>Your Collections</h2>
                        <Link href='/profile' className='text-label font-medium text-accent hover:text-accent-hover'>
                            View all
                        </Link>
                    </div>

                    <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                        {topCollections.map((collection) => (
                            <HomeCollectionCard key={collection.id} collection={collection} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
