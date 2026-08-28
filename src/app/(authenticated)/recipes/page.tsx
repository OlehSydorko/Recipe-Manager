'use client';

import { Suspense, useEffect, useState } from 'react';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { CategoryFilter } from '@/features/recipes/components/CategoryFilter';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { useCategories } from '@/hooks/useCategories';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useCommunityRecipes, useRecipes } from '@/hooks/useRecipes';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { BookOpen, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const MINE_TAB = 'mine';
const COMMUNITY_TAB = 'community';

type RecipesTab = typeof MINE_TAB | typeof COMMUNITY_TAB;

const TAB_BASE_CLASSES =
    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-label font-medium transition-colors duration-150';
const TAB_ACTIVE_CLASSES = 'border-accent bg-accent-muted text-accent';
const TAB_INACTIVE_CLASSES =
    'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary';

export default function RecipesPage() {
    return (
        <Suspense fallback={null}>
            <RecipesPageContent />
        </Suspense>
    );
}

function RecipesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasMounted = useHasMounted();
    const { data: currentProfile, isPending: profilePending } = useCurrentProfile();
    const isGuest = hasMounted && !profilePending && !currentProfile;
    const { requireAuth, authGate } = useRequireAuth('Sign in to create a recipe.');
    const [activeTab, setActiveTab] = useState<RecipesTab>(
        searchParams.get('tab') === COMMUNITY_TAB ? COMMUNITY_TAB : MINE_TAB
    );

    const { data: myRecipes, isPending: myRecipesPending, isError: myRecipesError } = useRecipes();
    const { data: communityRecipes, isPending: communityPending, isError: communityError } = useCommunityRecipes();
    const { data: categories } = useCategories();
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');

    useEffect(() => {
        setSearchQuery(searchParams.get('q') ?? '');
    }, [searchParams]);

    useEffect(() => {
        setActiveTab(searchParams.get('tab') === COMMUNITY_TAB ? COMMUNITY_TAB : MINE_TAB);
    }, [searchParams]);

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));
    const isMineTab = !isGuest && activeTab === MINE_TAB;

    const filteredMyRecipes = myRecipes
        ?.filter((recipe) => !categoryFilter || recipe.category_id === categoryFilter)
        .filter((recipe) => !showFavoritesOnly || recipe.is_favorite)
        .filter(
            (recipe) => !searchQuery.toLowerCase() || recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const filteredCommunityRecipes = communityRecipes?.filter(
        (recipe) => !searchQuery.toLowerCase() || recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isPending = isMineTab ? myRecipesPending : communityPending;
    const isError = isMineTab ? myRecipesError : communityError;
    const filteredRecipes = isMineTab ? filteredMyRecipes : filteredCommunityRecipes;
    const isFiltered = isMineTab
        ? Boolean(categoryFilter) || showFavoritesOnly || Boolean(searchQuery.trim())
        : Boolean(searchQuery.trim());

    return (
        <div>
            <div className='flex flex-wrap items-center justify-between gap-4'>
                <h1 className='text-display font-semibold text-text-primary'>Recipes</h1>

                <button
                    type='button'
                    onClick={() => requireAuth(() => router.push('/recipes/new'))}
                    className='inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-all duration-150 hover:bg-accent-hover hover:shadow-md active:scale-[0.98]'
                >
                    <Plus size={16} />
                    New recipe
                </button>
                {authGate}
            </div>

            <div role='group' aria-label='Recipes tab' className='mt-5 flex flex-wrap gap-2'>
                {!isGuest && (
                    <button
                        type='button'
                        aria-pressed={isMineTab}
                        onClick={() => setActiveTab(MINE_TAB)}
                        className={`${TAB_BASE_CLASSES} ${isMineTab ? TAB_ACTIVE_CLASSES : TAB_INACTIVE_CLASSES}`}
                    >
                        My Recipes
                    </button>
                )}

                <button
                    type='button'
                    aria-pressed={!isMineTab}
                    onClick={() => setActiveTab(COMMUNITY_TAB)}
                    className={`${TAB_BASE_CLASSES} ${!isMineTab ? TAB_ACTIVE_CLASSES : TAB_INACTIVE_CLASSES}`}
                >
                    <Users size={14} />
                    Community
                </button>
            </div>

            {isMineTab && (
                <div className='mt-5'>
                    <CategoryFilter
                        categories={categories}
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        showFavoritesOnly={showFavoritesOnly}
                        onToggleFavoritesOnly={() => setShowFavoritesOnly((previous) => !previous)}
                    />
                </div>
            )}

            {isError && <p className='mt-8 text-body text-error'>Could not load recipes.</p>}

            {isPending && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {Array.from({ length: 6 }).map((_, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <RecipeCardSkeleton key={index} />
                    ))}
                </div>
            )}

            {!isPending && !isError && filteredRecipes?.length === 0 && (
                <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                    <BookOpen size={32} className='text-text-disabled' />
                    <p className='text-h3 font-medium text-text-primary'>
                        {isFiltered
                            ? 'No recipes match these filters'
                            : isMineTab
                              ? 'No recipes yet'
                              : 'No community recipes yet'}
                    </p>
                    <p className='text-body text-text-secondary'>
                        {isFiltered
                            ? 'Try a different filter.'
                            : isMineTab
                              ? 'Create your first recipe to get started.'
                              : 'Recipes from other users will show up here.'}
                    </p>
                    {!isFiltered && isMineTab && (
                        <Link
                            href='/recipes/new'
                            className='mt-2 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-button font-medium text-accent-foreground shadow-sm transition-colors duration-150 hover:bg-accent-hover'
                        >
                            <Plus size={16} />
                            Create recipe
                        </Link>
                    )}
                </div>
            )}

            {!isPending && !isError && isMineTab && filteredMyRecipes && filteredMyRecipes.length > 0 && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {filteredMyRecipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            categoryName={categoryNameById.get(recipe.category_id) ?? 'Uncategorized'}
                        />
                    ))}
                </div>
            )}

            {!isPending && !isError && !isMineTab && filteredCommunityRecipes && filteredCommunityRecipes.length > 0 && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {filteredCommunityRecipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            categoryName={recipe.categoryName ?? 'Uncategorized'}
                            author={recipe.author}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
