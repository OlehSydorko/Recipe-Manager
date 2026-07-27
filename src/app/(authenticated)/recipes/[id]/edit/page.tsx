'use client';

import { use, useEffect, useState } from 'react';
import { CategorySelect } from '@/components/CategorySelect';
import { IngredientRows, createEmptyIngredientDraft } from '@/components/IngredientRows';
import { useIngredients, useReplaceIngredients } from '@/hooks/useIngredients';
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import type { IngredientDraft } from '@/types/ingredient';
import { useRouter } from 'next/navigation';

type EditRecipePageProps = {
    params: Promise<{ id: string }>;
};

export default function EditRecipePage({ params }: EditRecipePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending: recipePending } = useRecipe(id);
    const { data: existingIngredients, isPending: ingredientsPending } = useIngredients(id);
    const updateRecipe = useUpdateRecipe();
    const replaceIngredients = useReplaceIngredients();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);

    useEffect(() => {
        if (recipe) {
            setTitle(recipe.title);
            setDescription(recipe.description ?? '');
            setCategoryId(recipe.category_id);
        }
    }, [recipe]);

    useEffect(() => {
        if (existingIngredients && existingIngredients.length > 0) {
            setIngredients(
                existingIngredients.map((ingredient) => ({
                    key: ingredient.id,
                    name: ingredient.name,
                    quantity: ingredient.quantity ?? '',
                    unit: ingredient.unit ?? ''
                }))
            );
        }
    }, [existingIngredients]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim() || !categoryId) {
            return;
        }

        await updateRecipe.mutateAsync({ id, title: title.trim(), description, categoryId });

        await replaceIngredients.mutateAsync({ ingredients, recipeId: id });

        router.push(`/recipes/${id}`);
    };

    if (recipePending || ingredientsPending) {
        return <p className='text-sm text-gray-600'>Loading…</p>;
    }

    return (
        <div>
            <h1 className='text-2xl font-semibold'>Edit recipe</h1>

            <form onSubmit={handleSubmit} className='mt-4 max-w-md space-y-4'>
                <div>
                    <label htmlFor='title' className='block text-sm font-medium'>
                        Title
                    </label>
                    <input
                        id='title'
                        type='text'
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                        className='mt-1 w-full rounded border px-3 py-2'
                    />
                </div>

                <CategorySelect value={categoryId} onChange={setCategoryId} />

                <IngredientRows ingredients={ingredients} onChange={setIngredients} />

                <div>
                    <label htmlFor='description' className='block text-sm font-medium'>
                        Instructions
                    </label>
                    <textarea
                        id='description'
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={3}
                        className='mt-1 w-full rounded border px-3 py-2'
                    />
                </div>

                <button
                    type='submit'
                    disabled={updateRecipe.isPending || replaceIngredients.isPending}
                    className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
                >
                    {updateRecipe.isPending || replaceIngredients.isPending ? 'Saving…' : 'Save changes'}
                </button>
            </form>
        </div>
    );
}
