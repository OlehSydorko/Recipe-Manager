'use client';

import { use, useEffect, useState } from 'react';
import { CategorySelect } from '@/components/CategorySelect';
import { IngredientRows, createEmptyIngredientDraft } from '@/components/IngredientRows';
import { LeaveButton } from '@/components/LeaveButton';
import { useIngredients, useReplaceIngredients } from '@/hooks/useIngredients';
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { isFormDirty } from '@/lib/formDirty';
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
    const [instructions, setInstructions] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);

    // Snapshots of the loaded data, used only to detect unsaved changes for the Leave button.
    // `null` until the fetch resolves, so isFormDirty treats "still loading" as "not dirty".
    const [initialForm, setInitialForm] = useState<{
        title: string;
        description: string;
        instructions: string;
        categoryId: string;
    } | null>(null);
    const [initialIngredients, setInitialIngredients] = useState<IngredientDraft[] | null>(null);

    useEffect(() => {
        if (recipe) {
            const loadedForm = {
                title: recipe.title,
                description: recipe.description ?? '',
                instructions: recipe.instructions ?? '',
                categoryId: recipe.category_id
            };

            setTitle(loadedForm.title);
            setDescription(loadedForm.description);
            setInstructions(loadedForm.instructions);
            setCategoryId(loadedForm.categoryId);
            setInitialForm(loadedForm);
        }
    }, [recipe]);

    useEffect(() => {
        if (existingIngredients && existingIngredients.length > 0) {
            const loadedIngredients = existingIngredients.map((ingredient) => ({
                key: ingredient.id,
                name: ingredient.name,
                quantity: ingredient.quantity ?? '',
                unit: ingredient.unit ?? ''
            }));

            setIngredients(loadedIngredients);
            setInitialIngredients(loadedIngredients);
        }
    }, [existingIngredients]);

    const isDirty =
        isFormDirty(initialForm, { title, description, instructions, categoryId }) ||
        isFormDirty(initialIngredients, ingredients);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim() || !categoryId) {
            return;
        }

        await updateRecipe.mutateAsync({ id, title: title.trim(), description, instructions, categoryId });

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

                <div>
                    <label htmlFor='description' className='block text-sm font-medium'>
                        Description <span className='font-normal text-gray-500'>(optional)</span>
                    </label>
                    <textarea
                        id='description'
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={2}
                        className='mt-1 w-full rounded border px-3 py-2'
                    />
                </div>

                <IngredientRows ingredients={ingredients} onChange={setIngredients} />

                <div>
                    <label htmlFor='instructions' className='block text-sm font-medium'>
                        Instructions
                    </label>
                    <textarea
                        id='instructions'
                        value={instructions}
                        onChange={(event) => setInstructions(event.target.value)}
                        rows={5}
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

            <LeaveButton isDirty={isDirty} disabled={updateRecipe.isPending || replaceIngredients.isPending} />
        </div>
    );
}
