'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { RecipeThumbnail } from '@/features/recipes/components/RecipeThumbnail';
import { useIngredients } from '@/hooks/useIngredients';
import { useRecipe, useRecipes } from '@/hooks/useRecipes';
import { useAddShoppingListItems } from '@/hooks/useShoppingList';
import { scaleQuantity } from '@/lib/quantity';
import { DEFAULT_SHOPPING_SECTION } from '@/types/shoppingListItem';
import { Check } from 'lucide-react';

type AddFromRecipeModalProps = {
    open: boolean;
    onClose: () => void;
    recipeId?: string | null;
    scaleFactor?: number;
};

export function AddFromRecipeModal({ open, onClose, recipeId = null, scaleFactor = 1 }: AddFromRecipeModalProps) {
    const [pickedRecipeId, setPickedRecipeId] = useState<string | null>(null);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const effectiveRecipeId = recipeId ?? pickedRecipeId;
    const showPicker = !recipeId && !pickedRecipeId;

    const { data: myRecipes } = useRecipes();
    const { data: recipe } = useRecipe(effectiveRecipeId ?? '');
    const { data: ingredients } = useIngredients(effectiveRecipeId ?? '');
    const addItems = useAddShoppingListItems();

    useEffect(() => {
        if (open) {
            setPickedRecipeId(null);
        }
    }, [open]);

    useEffect(() => {
        if (ingredients) {
            setCheckedIds(new Set(ingredients.map((ingredient) => ingredient.id)));
        }
    }, [ingredients]);

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

    const handleSubmit = async () => {
        if (!ingredients || !effectiveRecipeId) {
            return;
        }

        const inputs = ingredients
            .filter((ingredient) => checkedIds.has(ingredient.id))
            .map((ingredient) => ({
                name: ingredient.name,
                quantity: scaleQuantity(ingredient.quantity, scaleFactor) ?? '',
                section: DEFAULT_SHOPPING_SECTION,
                sourceRecipeId: effectiveRecipeId,
                unit: ingredient.unit ?? ''
            }));

        await addItems.mutateAsync(inputs);
        onClose();
    };

    if (showPicker) {
        return (
            <Modal open={open} onClose={onClose} title='Choose a recipe'>
                {myRecipes?.length === 0 && <p>You don&apos;t have any recipes yet.</p>}

                {myRecipes && myRecipes.length > 0 && (
                    <div className='max-h-72 space-y-1 overflow-y-auto'>
                        {myRecipes.map((myRecipe) => (
                            <button
                                key={myRecipe.id}
                                type='button'
                                onClick={() => setPickedRecipeId(myRecipe.id)}
                                className='flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-body text-text-primary transition-colors duration-150 hover:bg-hover'
                            >
                                <RecipeThumbnail
                                    imagePath={myRecipe.image_url}
                                    alt={myRecipe.title}
                                    className='h-9 w-9'
                                    iconSize={16}
                                />
                                <span className='truncate'>{myRecipe.title}</span>
                            </button>
                        ))}
                    </div>
                )}
            </Modal>
        );
    }

    const checkedCount = checkedIds.size;

    return (
        <Modal open={open} onClose={onClose} title='Add ingredients to shopping list'>
            {recipe && (
                <p className='mb-3 text-label font-medium text-text-primary'>
                    {recipe.title} — {recipe.portions} {recipe.portions === 1 ? 'serving' : 'servings'}
                </p>
            )}

            {ingredients && ingredients.length === 0 && (
                <p className='text-body text-text-secondary'>This recipe has no ingredients yet.</p>
            )}

            {ingredients && ingredients.length > 0 && (
                <div className='max-h-72 space-y-1 overflow-y-auto'>
                    {ingredients.map((ingredient) => {
                        const isChecked = checkedIds.has(ingredient.id);
                        const scaledQuantity = scaleQuantity(ingredient.quantity, scaleFactor);

                        return (
                            <label
                                key={ingredient.id}
                                className='flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-body transition-colors duration-150 hover:bg-hover'
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
                                        <Check size={13} className='absolute inset-0 m-auto text-accent-foreground' />
                                    )}
                                </span>

                                <span className='text-button font-mono text-text-secondary'>
                                    {scaledQuantity ? `${scaledQuantity} ` : ''}
                                    {ingredient.unit ?? ''}
                                </span>

                                <span className='text-text-primary'>{ingredient.name}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            <div className='mt-4 flex justify-end gap-2'>
                <Button type='button' variant='ghost' onClick={onClose} disabled={addItems.isPending}>
                    Cancel
                </Button>
                <Button
                    type='button'
                    variant='primary'
                    onClick={handleSubmit}
                    disabled={checkedCount === 0 || addItems.isPending}
                >
                    {addItems.isPending ? 'Adding…' : `Add ${checkedCount} ${checkedCount === 1 ? 'item' : 'items'}`}
                </Button>
            </div>
        </Modal>
    );
}
