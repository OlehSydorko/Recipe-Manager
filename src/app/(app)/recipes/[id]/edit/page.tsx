'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useCategories } from '@/hooks/useCategories';
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes';

type EditRecipePageProps = {
    params: Promise<{ id: string }>;
};

export default function EditRecipePage({ params }: EditRecipePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { data: recipe, isPending: recipePending } = useRecipe(id);
    const { data: categories, isPending: categoriesPending } = useCategories();
    const updateRecipe = useUpdateRecipe();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');

    useEffect(() => {
        if (recipe) {
            setTitle(recipe.title);
            setDescription(recipe.description ?? '');
            setCategoryId(recipe.category_id);
        }
    }, [recipe]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!title.trim() || !categoryId) {
            return;
        }

        updateRecipe.mutate(
            { id, title: title.trim(), description, categoryId },
            {
                onSuccess: () => router.push(`/recipes/${id}`)
            }
        );
    };

    if (recipePending || categoriesPending) {
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

                <div>
                    <label htmlFor='category' className='block text-sm font-medium'>
                        Category
                    </label>
                    <select
                        id='category'
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                        required
                        className='mt-1 w-full rounded border px-3 py-2'
                    >
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
                    disabled={updateRecipe.isPending}
                    className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
                >
                    {updateRecipe.isPending ? 'Saving…' : 'Save changes'}
                </button>
            </form>
        </div>
    );
}
