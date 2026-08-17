'use client';

import { useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import {
    useAddRecipeToCollection,
    useCollectionIdsForRecipe,
    useCollections,
    useRemoveRecipeFromCollection
} from '@/hooks/useCollections';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Bookmark } from 'lucide-react';
import Link from 'next/link';

type SaveToCollectionButtonProps = {
    recipeId: string;
};

export function SaveToCollectionButton({ recipeId }: SaveToCollectionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data: collections } = useCollections();
    const { data: collectionIds } = useCollectionIdsForRecipe(isOpen ? recipeId : null);
    const addToCollection = useAddRecipeToCollection();
    const removeFromCollection = useRemoveRecipeFromCollection();
    const { requireAuth, authGate } = useRequireAuth('Sign in to save recipes to a collection.');

    const savedCollectionIds = new Set(collectionIds ?? []);

    const handleToggle = (collectionId: string) => {
        if (savedCollectionIds.has(collectionId)) {
            removeFromCollection.mutate({ collectionId, recipeId });
        } else {
            addToCollection.mutate({ collectionId, recipeId });
        }
    };

    return (
        <>
            <IconButton aria-label='Save to collection' onClick={() => requireAuth(() => setIsOpen(true))}>
                <Bookmark size={18} />
            </IconButton>
            {authGate}

            <Modal open={isOpen} onClose={() => setIsOpen(false)} title='Save to collection'>
                {collections?.length === 0 && (
                    <p>
                        You don&apos;t have any collections yet.{' '}
                        <Link href='/collections' className='font-medium text-accent hover:text-accent-hover'>
                            Create one
                        </Link>
                        .
                    </p>
                )}

                {collections && collections.length > 0 && (
                    <div className='max-h-60 space-y-1 overflow-y-auto'>
                        {collections.map((collection) => (
                            <label
                                key={collection.id}
                                className='flex items-center gap-2 rounded-sm px-1 py-1.5 text-body text-text-primary hover:bg-hover'
                            >
                                <input
                                    type='checkbox'
                                    checked={savedCollectionIds.has(collection.id)}
                                    onChange={() => handleToggle(collection.id)}
                                    className='h-4 w-4 rounded-sm border-border-strong accent-accent'
                                />
                                {collection.name}
                            </label>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
}
