'use client';

import { use, useState } from 'react';
import { useIngredients } from '@/hooks/useIngredients';
import { useDeleteRecipe, useRecipe } from '@/hooks/useRecipes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type RecipeDetailPageProps = {
    params: Promise<{ id: string }>;
};

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending, isError } = useRecipe(id);
    const { data: ingredients, isPending: ingredientsPending } = useIngredients(id);
    const deleteRecipe = useDeleteRecipe();

    // Client-only checklist state — never persisted, resets on reload by design.
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

    const handleDelete = () => {
        deleteRecipe.mutate(id, {
            onSuccess: () => router.push('/recipes')
        });
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
        return <p className='text-sm text-gray-600'>Loading recipe…</p>;
    }

    if (isError || !recipe) {
        return <p className='text-sm text-red-600'>Recipe not found.</p>;
    }

    return (
        <div>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-semibold'>{recipe.title}</h1>
                <div className='flex gap-2'>
                    <Link href={`/recipes/${recipe.id}/edit`} className='rounded border px-3 py-2 text-sm'>
                        Edit
                    </Link>
                    <button
                        type='button'
                        onClick={handleDelete}
                        disabled={deleteRecipe.isPending}
                        className='rounded border border-red-600 px-3 py-2 text-sm text-red-600 disabled:opacity-50'
                    >
                        Delete
                    </button>
                </div>
            </div>

            {recipe.description && <p className='mt-4 text-sm text-gray-600'>{recipe.description}</p>}

            <div className='mt-6'>
                <h2 className='text-lg font-semibold'>Ingredients</h2>

                {ingredientsPending && <p className='mt-2 text-sm text-gray-600'>Loading ingredients…</p>}

                {!ingredientsPending && ingredients?.length === 0 && (
                    <p className='mt-2 text-sm text-gray-600'>No ingredients yet.</p>
                )}

                {!ingredientsPending && ingredients && ingredients.length > 0 && (
                    <ul className='mt-2 space-y-1'>
                        {ingredients.map((ingredient) => {
                            const isChecked = checkedIds.has(ingredient.id);

                            return (
                                <li key={ingredient.id}>
                                    <label className='flex items-center gap-2 text-sm'>
                                        <input
                                            type='checkbox'
                                            checked={isChecked}
                                            onChange={() => handleToggleIngredient(ingredient.id)}
                                            className='h-4 w-4'
                                        />
                                        <span className={isChecked ? 'text-gray-400 line-through' : ''}>
                                            {ingredient.quantity ? `${ingredient.quantity} ` : ''}
                                            {ingredient.unit ? `${ingredient.unit} ` : ''}
                                            {ingredient.name}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
