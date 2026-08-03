'use client';

import { use, useEffect, useState } from 'react';
import { FavoriteStar } from '@/features/recipes/components/FavoriteStar';
import { LeaveButton } from '@/features/social/components/LeaveButton';
import { PortionsChanger } from '@/features/recipes/components/PortionsChanger';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextLineSkeleton } from '@/components/ui/Skeleton';
import { useIngredients } from '@/hooks/useIngredients';
import { useDeleteRecipe, useRecipe, useRecipeImageUrl } from '@/hooks/useRecipes';
import { scaleQuantity } from '@/lib/quantity';
import { Check, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

type RecipeDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending, isError } = useRecipe(id);
    const { data: ingredients, isPending: ingredientsPending } = useIngredients(id);
    const { data: imageUrl } = useRecipeImageUrl(recipe?.image_url);
    const deleteRecipe = useDeleteRecipe();

    // Client-only checklist state — never persisted, resets on reload by design.
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    // Portions changer is also client-only and resets on reload, same as the
    // checklist above — it never writes back to the recipe's base portions.
    const [selectedPortions, setSelectedPortions] = useState(1);

    useEffect(() => {
        if (recipe) {
            setSelectedPortions(recipe.portions);
        }
    }, [recipe]);

    const scaleFactor = recipe ? selectedPortions / recipe.portions : 1;

    const handleDelete = () => {
        deleteRecipe.mutate(
            { id, imagePath: recipe?.image_url },
            {
                onSuccess: () => router.push('/recipes')
            }
        );
    };

    const handleToggleIngredient = (ingredientId: string) => {
        setCheckedIds((previous) => {
            const next = new Set(previous);

            if (next.has(ingredientId)) {
                next.delete(ingredientId);
            } else {
                next.add(ingredientId);
            }

            return next;
        });
    };

    if (isPending) {
        return (
            <div className='space-y-4'>
                <TextLineSkeleton className='h-56 w-full rounded-lg sm:h-72' />
                <TextLineSkeleton className='h-7 w-1/2' />
                <TextLineSkeleton className='h-4 w-1/3' />
            </div>
        );
    }

    if (isError || !recipe) {
        return <p className='text-body text-error'>Recipe not found.</p>;
    }

    return (
        <div>
            {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt={recipe.title} className='h-56 w-full rounded-lg object-cover sm:h-72' />
            ) : (
                <div className='flex h-56 w-full items-center justify-center rounded-lg bg-bg-secondary text-text-disabled sm:h-72'>
                    <ImageIcon size={36} />
                </div>
            )}

            <div className='mt-5 flex items-start justify-between gap-3'>
                <h1 className='text-display font-semibold text-text-primary'>{recipe.title}</h1>

                <div className='flex items-center gap-1'>
                    <FavoriteStar recipeId={recipe.id} isFavorite={recipe.is_favorite} />

                    <ActionMenu
                        ariaLabel={`Actions for ${recipe.title}`}
                        items={[
                            { label: 'Edit', onSelect: () => router.push(`/recipes/${recipe.id}/edit`) },
                            { label: 'Delete', variant: 'danger', onSelect: () => setIsDeleteConfirmOpen(true) }
                        ]}
                    />
                </div>
            </div>

            {recipe.description && <p className='mt-2 text-body text-text-secondary'>{recipe.description}</p>}

            <div className='mt-8 rounded-lg border border-border bg-surface p-5'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                    <h2 className='text-h2 font-semibold text-text-primary'>Ingredients</h2>
                    <PortionsChanger value={selectedPortions} onChange={setSelectedPortions} />
                </div>

                {ingredientsPending && (
                    <div className='mt-3 space-y-2'>
                        <TextLineSkeleton className='w-full' />
                        <TextLineSkeleton className='w-5/6' />
                        <TextLineSkeleton className='w-2/3' />
                    </div>
                )}

                {!ingredientsPending && ingredients?.length === 0 && (
                    <p className='mt-3 text-body text-text-secondary'>No ingredients yet.</p>
                )}

                {!ingredientsPending && ingredients && ingredients.length > 0 && (
                    <ul className='mt-3 space-y-2'>
                        {ingredients.map((ingredient) => {
                            const isChecked = checkedIds.has(ingredient.id);
                            const scaledQuantity = scaleQuantity(ingredient.quantity, scaleFactor);

                            return (
                                <li key={ingredient.id}>
                                    <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-body transition-colors duration-150 hover:bg-hover ${
                                            isChecked ? 'bg-hover' : ''
                                        }`}
                                    >
                                        <span className='relative flex h-5 w-5 shrink-0 items-center justify-center'>
                                            <input
                                                type='checkbox'
                                                checked={isChecked}
                                                onChange={() => handleToggleIngredient(ingredient.id)}
                                                className='sr-only'
                                            />
                                            <span
                                                className={`h-5 w-5 rounded-sm border transition-colors duration-150 ${
                                                    isChecked ? 'border-accent bg-accent' : 'border-border-strong'
                                                }`}
                                            />
                                            {isChecked && (
                                                <Check
                                                    size={13}
                                                    className='animate-check-pop absolute inset-0 m-auto text-accent-foreground'
                                                />
                                            )}
                                        </span>

                                        <span
                                            className={`text-button font-mono ${isChecked ? 'text-text-disabled' : 'text-text-secondary'}`}
                                        >
                                            {scaledQuantity ? `${scaledQuantity} ` : ''}
                                            {ingredient.unit ?? ''}
                                        </span>

                                        <span
                                            className={
                                                isChecked ? 'text-text-disabled line-through' : 'text-text-primary'
                                            }
                                        >
                                            {ingredient.name}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {recipe.instructions && (
                <div className='mt-6 rounded-lg border border-border bg-surface p-5'>
                    <h2 className='text-h2 font-semibold text-text-primary'>Instructions</h2>
                    <p className='mt-3 whitespace-pre-line text-body text-text-secondary'>{recipe.instructions}</p>
                </div>
            )}

            <LeaveButton />

            <Modal
                open={isDeleteConfirmOpen}
                onClose={() => setIsDeleteConfirmOpen(false)}
                title='Delete recipe?'
                footer={
                    <>
                        <Button variant='secondary' onClick={() => setIsDeleteConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant='danger' onClick={handleDelete} disabled={deleteRecipe.isPending}>
                            {deleteRecipe.isPending ? 'Deleting…' : 'Delete'}
                        </Button>
                    </>
                }
            >
                {`Delete "${recipe.title}"? This can't be undone.`}
            </Modal>
        </div>
    );
}
