'use client';

import { useState } from 'react';

import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';

export default function CategoriesPage() {
    const { data: categories, isPending, isError } = useCategories();
    const createCategory = useCreateCategory();
    const deleteCategory = useDeleteCategory();
    const [name, setName] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        createCategory.mutate(name.trim(), {
            onSuccess: () => setName('')
        });
    };

    if (isPending) {
        return <p className='text-sm text-gray-600'>Loading categories…</p>;
    }

    if (isError) {
        return <p className='text-sm text-red-600'>Could not load categories.</p>;
    }

    return (
        <div>
            <h1 className='text-2xl font-semibold'>Categories</h1>

            <form onSubmit={handleSubmit} className='mt-4 flex gap-2'>
                <input
                    type='text'
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder='New category name'
                    className='flex-1 rounded border px-3 py-2'
                />
                <button
                    type='submit'
                    disabled={createCategory.isPending}
                    className='rounded bg-black px-4 py-2 text-white disabled:opacity-50'
                >
                    Add
                </button>
            </form>

            <ul className='mt-6 space-y-2'>
                {categories.map((category) => (
                    <li key={category.id} className='flex items-center justify-between rounded border px-3 py-2'>
                        <span>{category.name}</span>
                        <button
                            type='button'
                            onClick={() => deleteCategory.mutate(category.id)}
                            disabled={deleteCategory.isPending}
                            className='text-sm text-red-600 disabled:opacity-50'
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
