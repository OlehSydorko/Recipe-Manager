'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { CategorySelect } from '@/components/CategorySelect';
import { useCreateRecipe } from '@/hooks/useRecipes';

export default function NewRecipePage() {
    const router = useRouter();
    const createRecipe = useCreateRecipe();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim() || !categoryId) {
            return;
        }

        createRecipe.mutate(
            { title: title.trim(), description, categoryId },
            {
                onSuccess: (recipe) => {
                    router.push(`/recipes/${recipe.id}`);
                }
            }
        );
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
                        Description
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
                    disabled={createRecipe.isPending}
                    className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
                >
                    {createRecipe.isPending ? 'Creating…' : 'Create recipe'}
                </button>
            </form>
        </div>
    );
}
