'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { RecipeThumbnail } from '@/features/recipes/components/RecipeThumbnail';
import { useCollectionRecipeIds, useCreateCollection, useUpdateCollection } from '@/hooks/useCollections';
import type { CollectionWithCount } from '@/types/collection';
import type { Recipe } from '@/types/recipe';

type CollectionModalProps = {
    open: boolean;
    onClose: () => void;
    collection: CollectionWithCount | null;
    recipes: Recipe[];
};

export function CollectionModal({ open, onClose, collection, recipes }: CollectionModalProps) {
    const { data: existingRecipeIds } = useCollectionRecipeIds(collection?.id ?? null);
    const createCollection = useCreateCollection();
    const updateCollection = useUpdateCollection();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setName(collection?.name ?? '');
            setDescription(collection?.description ?? '');
            setIsPublic(collection?.is_public ?? false);
            setSelectedRecipeIds(collection ? (existingRecipeIds ?? []) : []);
        }
    }, [open, collection, existingRecipeIds]);

    const isSubmitting = createCollection.isPending || updateCollection.isPending;

    const toggleRecipe = (recipeId: string) => {
        setSelectedRecipeIds((previous) =>
            previous.includes(recipeId) ? previous.filter((id) => id !== recipeId) : [...previous, recipeId]
        );
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        if (collection) {
            await updateCollection.mutateAsync({
                id: collection.id,
                name: name.trim(),
                description: description.trim(),
                recipeIds: selectedRecipeIds,
                isPublic
            });
        } else {
            await createCollection.mutateAsync({
                name: name.trim(),
                description: description.trim(),
                recipeIds: selectedRecipeIds,
                isPublic
            });
        }

        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title={collection ? 'Edit collection' : 'New collection'}>
            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label
                        htmlFor='collection-name'
                        className='mb-1.5 block text-label font-medium text-text-secondary'
                    >
                        Name
                    </label>
                    <Input
                        id='collection-name'
                        type='text'
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        disabled={isSubmitting}
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor='collection-description'
                        className='mb-1.5 block text-label font-medium text-text-secondary'
                    >
                        Description <span className='font-normal text-text-disabled'>(optional)</span>
                    </label>
                    <Textarea
                        id='collection-description'
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                    />
                </div>

                <label className='flex items-center gap-2 text-body text-text-primary'>
                    <input
                        type='checkbox'
                        checked={isPublic}
                        onChange={(event) => setIsPublic(event.target.checked)}
                        disabled={isSubmitting}
                        className='h-4 w-4 rounded-sm border-border-strong accent-accent'
                    />
                    Make this collection public
                </label>
                <p className='-mt-2 text-caption text-text-secondary'>
                    Public collections can be viewed by anyone, including people who aren&apos;t signed in.
                </p>

                <div>
                    <span className='mb-1.5 block text-label font-medium text-text-secondary'>Recipes</span>
                    <div className='max-h-64 space-y-1 overflow-y-auto rounded-md border border-border p-2'>
                        {recipes.length === 0 && (
                            <p className='px-1 py-1 text-caption text-text-disabled'>No recipes yet.</p>
                        )}
                        {recipes.map((recipe) => (
                            <label
                                key={recipe.id}
                                className='flex items-center gap-2 rounded-sm px-1 py-1.5 text-body text-text-primary hover:bg-hover'
                            >
                                <input
                                    type='checkbox'
                                    checked={selectedRecipeIds.includes(recipe.id)}
                                    onChange={() => toggleRecipe(recipe.id)}
                                    disabled={isSubmitting}
                                    className='h-4 w-4 shrink-0 rounded-sm border-border-strong accent-accent'
                                />
                                <RecipeThumbnail
                                    imagePath={recipe.image_url}
                                    alt={recipe.title}
                                    className='h-9 w-9'
                                    iconSize={16}
                                />
                                <span className='truncate'>{recipe.title}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className='flex justify-end gap-2 pt-2'>
                    <Button type='button' variant='ghost' onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type='submit' variant='primary' disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
