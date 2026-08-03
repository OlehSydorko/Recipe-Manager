'use client';

import { useMemo, useState } from 'react';
import { ActivityFeed } from '@/features/profile/components/ActivityFeed';
import { CollectionCard } from '@/features/recipes/components/CollectionCard';
import { CollectionModal } from '@/features/recipes/components/CollectionModal';
import { EditProfileModal } from '@/features/profile/components/EditProfileModal';
import { FollowListModal } from '@/features/social/components/FollowListModal';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileStats } from '@/features/profile/components/ProfileStats';
import { type ProfileTabId, ProfileTabs } from '@/features/profile/components/ProfileTabs';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { RecipeGridControls, type RecipeSortOption, type RecipeViewMode } from '@/features/recipes/components/RecipeGridControls';
import { RecipeListRow } from '@/features/recipes/components/RecipeListRow';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { useActivity } from '@/hooks/useActivity';
import { useCategories } from '@/hooks/useCategories';
import { useCollections, useDeleteCollection } from '@/hooks/useCollections';
import { useFollowCounts } from '@/hooks/useFollows';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useRecipes } from '@/hooks/useRecipes';
import type { CollectionWithCount } from '@/types/collection';
import { BookOpen, Folder, Plus } from 'lucide-react';

const MY_RECIPES_TAB: ProfileTabId = 'my-recipes';
const FAVORITES_TAB: ProfileTabId = 'favorites';

export default function ProfilePage() {
    const { data: profile, isPending: profilePending, isError: profileError } = useCurrentProfile();
    const { data: recipes, isPending: recipesPending } = useRecipes();
    const { data: categories } = useCategories();
    const { data: collections, isPending: collectionsPending } = useCollections();
    const deleteCollection = useDeleteCollection();
    const { data: followCounts } = useFollowCounts(profile?.id ?? null);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ProfileTabId>(MY_RECIPES_TAB);
    const [sortBy, setSortBy] = useState<RecipeSortOption>('newest');
    const [viewMode, setViewMode] = useState<RecipeViewMode>('grid');
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
    const [editingCollection, setEditingCollection] = useState<CollectionWithCount | null>(null);
    const [deletingCollection, setDeletingCollection] = useState<CollectionWithCount | null>(null);
    const [followListMode, setFollowListMode] = useState<'followers' | 'following' | null>(null);

    const { data: activity, isPending: activityPending } = useActivity(
        activeTab === 'activity' ? (profile?.id ?? null) : null
    );

    const handleNewCollection = () => {
        setEditingCollection(null);
        setIsCollectionModalOpen(true);
    };

    const handleEditCollection = (collection: CollectionWithCount) => {
        setEditingCollection(collection);
        setIsCollectionModalOpen(true);
    };

    const handleDeleteCollection = () => {
        if (!deletingCollection) {
            return;
        }

        deleteCollection.mutate(deletingCollection.id, {
            onSuccess: () => setDeletingCollection(null)
        });
    };

    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    const tabRecipes = useMemo(() => {
        const source = recipes ?? [];
        const filtered = activeTab === FAVORITES_TAB ? source.filter((recipe) => recipe.is_favorite) : source;

        return [...filtered].sort((a, b) => {
            if (sortBy === 'oldest') {
                return a.created_at.localeCompare(b.created_at);
            }

            if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
            }

            return b.created_at.localeCompare(a.created_at);
        });
    }, [recipes, activeTab, sortBy]);

    if (profilePending) {
        return <p className='text-body text-text-secondary'>Loading…</p>;
    }

    if (profileError || !profile) {
        return <p className='text-body text-error'>Could not load profile.</p>;
    }

    const favoritesCount = recipes?.filter((recipe) => recipe.is_favorite).length ?? 0;
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

                    {recipesPending && (
                        <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                            {Array.from({ length: 6 }).map((_, index) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <RecipeCardSkeleton key={index} />
                            ))}
                        </div>
                    )}

                    {!recipesPending && tabRecipes.length === 0 && (
                        <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                            <BookOpen size={32} className='text-text-disabled' />
                            <p className='text-h3 font-medium text-text-primary'>
                                {activeTab === FAVORITES_TAB ? 'No favorites yet' : 'No recipes yet'}
                            </p>
                        </div>
                    )}

                    {!recipesPending && tabRecipes.length > 0 && viewMode === 'grid' && (
                        <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                            {tabRecipes.map((recipe) => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    categoryName={categoryNameById.get(recipe.category_id) ?? 'Uncategorized'}
                                    hideFavorite
                                />
                            ))}
                        </div>
                    )}

                    {!recipesPending && tabRecipes.length > 0 && viewMode === 'list' && (
                        <div className='mt-6 space-y-3'>
                            {tabRecipes.map((recipe) => (
                                <RecipeListRow
                                    key={recipe.id}
                                    recipe={recipe}
                                    categoryName={categoryNameById.get(recipe.category_id) ?? 'Uncategorized'}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'collections' && (
                <div>
                    <div className='mt-5 flex justify-end'>
                        <Button variant='primary' onClick={handleNewCollection}>
                            <Plus size={16} />
                            New collection
                        </Button>
                    </div>

                    {collectionsPending && <p className='mt-6 text-body text-text-secondary'>Loading…</p>}

                    {!collectionsPending && collections?.length === 0 && (
                        <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                            <Folder size={32} className='text-text-disabled' />
                            <p className='text-h3 font-medium text-text-primary'>No collections yet</p>
                            <p className='text-body text-text-secondary'>
                                Group recipes together, like &quot;weeknight dinners&quot; or &quot;meal prep&quot;.
                            </p>
                        </div>
                    )}

                    {!collectionsPending && collections && collections.length > 0 && (
                        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {collections.map((collection) => (
                                <CollectionCard
                                    key={collection.id}
                                    collection={collection}
                                    onEdit={() => handleEditCollection(collection)}
                                    onDelete={() => setDeletingCollection(collection)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'activity' && (
                <div>
                    {activityPending && <p className='mt-6 text-body text-text-secondary'>Loading…</p>}

                    {!activityPending && activity?.length === 0 && (
                        <p className='mt-8 text-body text-text-secondary'>No activity yet.</p>
                    )}

                    {!activityPending && activity && activity.length > 0 && <ActivityFeed items={activity} />}
                </div>
            )}

            <EditProfileModal profile={profile} open={isEditOpen} onClose={() => setIsEditOpen(false)} />

            <CollectionModal
                open={isCollectionModalOpen}
                onClose={() => setIsCollectionModalOpen(false)}
                collection={editingCollection}
                recipes={recipes ?? []}
            />

            <Modal
                open={Boolean(deletingCollection)}
                onClose={() => setDeletingCollection(null)}
                title='Delete collection?'
                footer={
                    <>
                        <Button variant='secondary' onClick={() => setDeletingCollection(null)}>
                            Cancel
                        </Button>
                        <Button variant='danger' onClick={handleDeleteCollection} disabled={deleteCollection.isPending}>
                            {deleteCollection.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                {deletingCollection && `Delete "${deletingCollection.name}"? This can't be undone.`}
            </Modal>

            <FollowListModal
                userId={followListMode ? (profile.id ?? null) : null}
                mode={followListMode ?? 'followers'}
                onClose={() => setFollowListMode(null)}
            />
        </div>
    );
}
