'use client';

import { useMemo, useState } from 'react';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { EditProfileModal } from '@/features/profile/components/EditProfileModal';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileStats } from '@/features/profile/components/ProfileStats';
import { type ProfileTabId, ProfileTabs } from '@/features/profile/components/ProfileTabs';
import { RecipeCard } from '@/features/recipes/components/RecipeCard/RecipeCard';
import {
    RecipeGridControls,
    type RecipeSortOption,
    type RecipeViewMode
} from '@/features/recipes/components/RecipeGridControls';
import { RecipeListRow } from '@/features/recipes/components/RecipeListRow';
import { FollowListModal } from '@/features/social/components/FollowListModal';
import { useCategories } from '@/hooks/useCategories';
import { useFollowCounts } from '@/hooks/useFollows';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useFavoriteRecipes, useRecipes } from '@/hooks/useRecipes';
import { BookOpen } from 'lucide-react';
import { CollectionsSection } from '@/features/collections/components/CollectionsSection';


const MY_RECIPES_TAB: ProfileTabId = 'my-recipes';
const FAVORITES_TAB: ProfileTabId = 'favorites';

export default function ProfilePage() {
    const { data: profile, isPending: profilePending, isError: profileError } = useCurrentProfile();
    const { data: recipes, isPending: recipesPending } = useRecipes();
    const { data: favoriteRecipes, isPending: favoritesPending } = useFavoriteRecipes();
    const { data: categories } = useCategories();
    const { data: followCounts } = useFollowCounts(profile?.id ?? null);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTabId>(MY_RECIPES_TAB);
    const [sortBy, setSortBy] = useState<RecipeSortOption>('newest');
    const [viewMode, setViewMode] = useState<RecipeViewMode>('grid');
    const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    // Favorites can include recipes owned by other users, so their category names come
    // straight from useFavoriteRecipes() (a join) rather than this user's own categories map.
    const tabRecipes = useMemo(() => {
        const source =
            activeTab === FAVORITES_TAB
                ? (favoriteRecipes ?? []).map((recipe) => ({
                      ...recipe,
                      categoryName: recipe.categoryName ?? 'Uncategorized'
                  }))
                : (recipes ?? []).map((recipe) => ({
                      ...recipe,
                      categoryName: categoryNameById.get(recipe.category_id) ?? 'Uncategorized'
                  }));

        return [...source].sort((a, b) => {
            if (sortBy === 'oldest') {
                return a.created_at.localeCompare(b.created_at);
            }

            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }

            return b.created_at.localeCompare(a.created_at);
        });
    }, [recipes, favoriteRecipes, activeTab, sortBy, categoryNameById]);
    const tabRecipesPending = activeTab === FAVORITES_TAB ? favoritesPending : recipesPending;

    if (profilePending) {
        return <p className='text-body text-text-secondary'>Loading…</p>;
    }

    if (profileError || !profile) {
        return <p className='text-body text-error'>Could not load profile.</p>;
    }

    const favoritesCount = favoriteRecipes?.length ?? 0;
    const showRecipeGrid = activeTab === MY_RECIPES_TAB || activeTab === FAVORITES_TAB;

    return (
        <div>
            <ProfileHeader profile={profile} onEdit={() => setIsEditOpen(true)} />

            <ProfileStats
                recipesCount={recipes?.length ?? 0}
                favoritesCount={favoritesCount}
                followersCount={followCounts?.followers ?? 0}
                followingCount={followCounts?.following ?? 0}
                onRecipesClick={() => setActiveTab(MY_RECIPES_TAB)}
                onFavoritesClick={() => setActiveTab(FAVORITES_TAB)}
                onFollowersClick={() => setFollowListMode('followers')}
                onFollowingClick={() => setFollowListMode('following')}
            />

            <div className='mt-8'>
                <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {showRecipeGrid && (
                <div>
                    <div className='mt-5 flex justify-end'>
                        <RecipeGridControls
                            sortBy={sortBy}
                            onSortChange={setSortBy}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />
                    </div>

                    {tabRecipesPending && (
                        <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                            {Array.from({ length: 6 }).map((_, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <RecipeCardSkeleton key={index} />
                            ))}
                        </div>
                    )}

                    {!tabRecipesPending && tabRecipes.length === 0 && (
                        <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                            <BookOpen size={32} className='text-text-disabled' />
                            <p className='text-h3 font-medium text-text-primary'>
                                {activeTab === FAVORITES_TAB ? 'No favorites yet' : 'No recipes yet'}
                            </p>
                        </div>
                    )}

                    {!tabRecipesPending && tabRecipes.length > 0 && viewMode === 'grid' && (
                        <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                            {tabRecipes.map((recipe) => (
                                <RecipeCard key={recipe.id} recipe={recipe} categoryName={recipe.categoryName} hideFavorite />
                            ))}
                        </div>
                    )}

                    {!tabRecipesPending && tabRecipes.length > 0 && viewMode === 'list' && (
                        <div className='mt-6 space-y-3'>
                            {tabRecipes.map((recipe) => (
                                <RecipeListRow key={recipe.id} recipe={recipe} categoryName={recipe.categoryName} />
                            ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'collections' && <CollectionsSection variant='tab' />}

            <EditProfileModal profile={profile} open={isEditOpen} onClose={() => setIsEditOpen(false)} />

            <FollowListModal
                userId={followListMode ? (profile.id ?? null) : null}
                mode={followListMode ?? 'followers'}
                onClose={() => setFollowListMode(null)}
            />
        </div>
    );
}
