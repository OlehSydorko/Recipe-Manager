'use client';

import { use, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton';
import { CollectionModal } from '@/features/collections/CollectionModal';
import { RecipeCard } from '@/features/recipes/components/RecipeCard';
import { useCategories } from '@/hooks/useCategories';
import { useCollection, useCollectionRecipeIds } from '@/hooks/useCollections';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useRecipes, useRecipesByIds } from '@/hooks/useRecipes';
import { ChevronLeft, Folder, Plus } from 'lucide-react';
import Link from 'next/link';

type CollectionDetailPageProps = {
    params: Promise<{ id: string }>;
};

// Detail view for a single collection, reached by clicking a card/row on the
// Collections page, or directly via a shared link when the collection is
// public. Visibility is enforced by RLS through useCollection (owner or
// public), so this page works the same for the owner, a guest, or any other
// user -- only the owner sees the "Add recipe" edit entry point.
// Membership (adding/removing recipes) reuses CollectionModal as-is — it
// already writes a collection's full recipe list on save, so "Add recipe"
// here just opens the same edit form used from the collections grid.
export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
    const { id } = use(params);

    const { data: collection, isPending: collectionPending } = useCollection(id);
    const { data: recipeIds, isPending: recipeIdsPending } = useCollectionRecipeIds(id);
    const { data: collectionRecipes, isPending: recipesPending } = useRecipesByIds(recipeIds ?? []);
    const { data: categories } = useCategories();
    const { data: currentProfile } = useCurrentProfile();
    const { data: myRecipes } = useRecipes();
    const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

    const isOwner = Boolean(collection && currentProfile && collection.user_id === currentProfile.id);
    const categoryNameById = new Map(categories?.map((category) => [category.id, category.name]));

    const isPending = collectionPending || recipeIdsPending || (Boolean(recipeIds?.length) && recipesPending);

    if (!isPending && !collection) {
        return <p className='text-body text-error'>Collection not found.</p>;
    }

    return (
        <div>
            <Link
                href='/collections'
                className='inline-flex items-center gap-1 text-body text-text-secondary transition-colors duration-150 hover:text-text-primary'
            >
                <ChevronLeft size={16} />
                Collections
            </Link>

            <div className='mt-3 flex flex-wrap items-start justify-between gap-4'>
                <div>
                    <h1 className='text-display font-semibold text-text-primary'>{collection?.name}</h1>
                    {collection && (
                        <p className='mt-1 text-body text-text-secondary'>
                            {collection.recipeCount} {collection.recipeCount === 1 ? 'recipe' : 'recipes'}
                        </p>
                    )}
                </div>

                {isOwner && (
                    <Button variant='primary' onClick={() => setIsCollectionModalOpen(true)} disabled={!collection}>
                        <Plus size={16} />
                        Add recipe
                    </Button>
                )}
            </div>

            {isPending && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {Array.from({ length: 3 }).map((_, index) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <RecipeCardSkeleton key={index} />
                    ))}
                </div>
            )}

            {!isPending && collectionRecipes?.length === 0 && (
                <div className='mt-16 flex flex-col items-center gap-3 text-center'>
                    <Folder size={32} className='text-text-disabled' />
                    <p className='text-h3 font-medium text-text-primary'>No recipes in this collection yet</p>
                    {isOwner && <p className='text-body text-text-secondary'>Add recipes to get started.</p>}
                </div>
            )}

            {!isPending && collectionRecipes && collectionRecipes.length > 0 && (
                <div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3'>
                    {collectionRecipes.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            categoryName={categoryNameById.get(recipe.category_id) ?? 'Uncategorized'}
                        />
                    ))}
                </div>
            )}

            {isOwner && collection && (
                <CollectionModal
                    open={isCollectionModalOpen}
                    onClose={() => setIsCollectionModalOpen(false)}
                    collection={collection}
                    recipes={myRecipes ?? []}
                />
            )}
        </div>
    );
}
