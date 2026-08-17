'use client';

import { useMemo } from 'react';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { HomeCollectionCard } from '@/features/home/components/HomeCollectionCard';
import { HomeGreeting } from '@/features/home/components/HomeGreeting';
import { HomeSearchBar } from '@/features/home/components/HomeSearchBar';
import { HomeStats } from '@/features/home/components/HomeStats';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { useCategories } from '@/hooks/useCategories';
import { useCollections } from '@/hooks/useCollections';
import { useFollowCounts } from '@/hooks/useFollows';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useCommunityRecipes, useRecipes } from '@/hooks/useRecipes';
import type { Recipe, RecipeWithAuthor } from '@/types/recipe';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';

const RECENT_RECIPES_LIMIT = 4;
const COLLECTIONS_LIMIT = 4;

export default function HomePage() {
    const hasMounted = useHasMounted();
    const { data: profile, isPending: profilePending } = useCurrentProfile();
    // hasMounted-gated so the client's first paint always matches the
    // server (which never resolves this) -- see useHasMounted for why.
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

    // Guests have no "my recipes" dashboard to show -- the Recently Added
    // section becomes a preview of what the community's cooking instead, so
    // Home stays a genuine browsing page rather than an empty personal one.
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

    const sectionRecipes: (Recipe | RecipeWithAuthor)[] = isGuest ? recentCommunityRecipes : recentRecipes;
    const sectionPending = isGuest ? communityPending : recipesPending;
    const sectionError = isGuest ? communityError : recipesError;

    return (
        <div className='space-y-10'>
            <HomeGreeting displayName={profile?.display_name ?? null} />
            <HomeSearchBar />

            {isGuest ? (
                <div className='rounded-lg border border-border bg-surface p-5'>
                    <p className='text-body text-text-secondary'>
                        Browsing as a guest.{' '}
                        <Link href='/signup' className='font-medium text-accent hover:text-accent-hover'>
                            Sign up
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

            <section>
                <div className='flex items-center justify-between'>
                    <h2 className='text-h2 font-semibold text-text-primary'>
                        {isGuest ? 'From the community' : 'Recently added'}
                    </h2>
                    <Link href='/recipes' className='text-label font-medium text-accent hover:text-accent-hover'>
                        View all
                    </Link>
                </div>

                {sectionError && <p className='mt-4 text-body text-error'>Could not load recipes.</p>}

                {sectionPending && (
                    <div className='mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                        {Array.from({ length: RECENT_RECIPES_LIMIT }).map((_, index) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <RecipeCardSkeleton key={index} />
                        ))}
                    </div>
                )}

                {!sectionPending && !sectionError && sectionRecipes.length === 0 && (
                    <div className='mt-8 flex flex-col items-center gap-3 text-center'>
                        <BookOpen size={32} className='text-text-disabled' />
                        <p className='text-h3 font-medium text-text-primary'>No recipes yet</p>
                        {isGuest ? (
                            <p className='text-body text-text-secondary'>Check back soon.</p>
                        ) : (
                            <>
                                <p className='text-body text-text-secondary'>
                                    Create your first recipe to get started.
                                </p>
                                <Link
                                    href='/recipes/new'
                                    className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                                >
                                    Create recipe
                                </Link>
                            </>
                        )}
                    </div>
                )}

                {!sectionPending && !sectionError && sectionRecipes.length > 0 && (
                    <div className='mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
                        {sectionRecipes.map((recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                categoryName={
                                    'categoryName' in recipe
                                        ? (recipe.categoryName ?? 'Uncategorized')
                                        : (categoryNameById.get(recipe.category_id) ?? 'Uncategorized')
                                }
                                author={'author' in recipe ? recipe.author : undefined}
                            />
                        ))}
                    </div>
                )}
            </section>

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
