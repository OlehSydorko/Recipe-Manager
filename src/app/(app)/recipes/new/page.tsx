'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCategories } from '@/hooks/useCategories';
import { useCreateRecipe } from '@/hooks/useRecipes';

export default function NewRecipePage() {
    const router = useRouter();
    const { data: categories, isPending: categoriesPending } = useCategories();
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

    if (categoriesPending) {
        return <p className='text-sm text-gray-600'>Loading…</p>;
    }

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

                <div>
                    <label htmlFor='category' className='block text-sm font-medium'>
                        Category
                    </label>
                    <select
                        id='category'
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                        required
                        className='mt-1 w-full rounded border bg-white px-3 py-2 text-gray-900'
                    >
                        <option value=''>Select a category</option>
                        {categories?.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>

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
