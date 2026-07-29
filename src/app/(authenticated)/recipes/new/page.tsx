'use client';

import { useRef, useState } from 'react';
import { CategorySelect } from '@/components/CategorySelect';
import { IngredientRows, createEmptyIngredientDraft } from '@/components/IngredientRows';
import { LeaveButton } from '@/components/LeaveButton';
import { useReplaceIngredients } from '@/hooks/useIngredients';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { isFormDirty } from '@/lib/formDirty';
import type { IngredientDraft } from '@/types/ingredient';
import { useRouter } from 'next/navigation';

const INITIAL_FORM = { title: '', description: '', instructions: '', categoryId: '' };

export default function NewRecipePage() {
    const router = useRouter();
    const createRecipe = useCreateRecipe();
    const replaceIngredients = useReplaceIngredients();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [ingredients, setIngredients] = useState<IngredientDraft[]>([createEmptyIngredientDraft()]);

    // Captures the blank starting row once on mount, so edits/added/removed rows can be detected.
    const initialIngredientsRef = useRef(ingredients);

    const isDirty =
        isFormDirty(INITIAL_FORM, { title, description, instructions, categoryId }) ||
        isFormDirty(initialIngredientsRef.current, ingredients);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim() || !categoryId) {
            return;
        }

        const recipe = await createRecipe.mutateAsync({
            title: title.trim(),
            description,
            instructions,
            categoryId
        });

        await replaceIngredients.mutateAsync({ ingredients, recipeId: recipe.id });

        router.push(`/recipes/${recipe.id}`);
    };

    return (
        <div>
            <h1 className='text-2xl font-semibold'>New recipe</h1>

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
                    disabled={createRecipe.isPending || replaceIngredients.isPending}
                    className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
                >
                    {createRecipe.isPending || replaceIngredients.isPending ? 'Creating…' : 'Create recipe'}
                </button>
            </form>

            <LeaveButton isDirty={isDirty} disabled={createRecipe.isPending || replaceIngredients.isPending} />
        </div>
    );
}
