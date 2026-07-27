'use client';

import { useState } from 'react';

import { useCategories, useCreateCategory } from '@/hooks/useCategories';

const NEW_CATEGORY_VALUE = '__new__';

type CategorySelectProps = {
    value: string;
    onChange: (categoryId: string) => void;
};

export function CategorySelect({ value, onChange }: CategorySelectProps) {
    const { data: categories, isPending } = useCategories();
    const createCategory = useCreateCategory();
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = event.target.value;

        if (selected === NEW_CATEGORY_VALUE) {
            setIsCreating(true);
            
return;
        }

        onChange(selected);
    };

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) {
            return;
        }

        createCategory.mutate(newCategoryName.trim(), {
            onSuccess: (category) => {
                onChange(category.id);
                setIsCreating(false);
                setNewCategoryName('');
            }
        });
    };

    if (isPending) {
        return <p className='text-sm text-gray-600'>Loading categories…</p>;
    }

    return (
        <div>
            <label htmlFor='category' className='block text-sm font-medium'>
                Category
            </label>

            {isCreating ? (
                <div className='mt-1 flex gap-2'>
                    <input
                        type='text'
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        placeholder='New category name'
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        className='flex-1 rounded border px-3 py-2'
                    />
                    <button
                        type='button'
                        onClick={handleCreateCategory}
                        disabled={createCategory.isPending}
                        className='rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50'
                    >
                        Add
                    </button>
                    <button type='button' onClick={() => setIsCreating(false)} className='rounded border px-3 py-2 text-sm'>
                        Cancel
                    </button>
                </div>
            ) : (
                <select
                    id='category'
                    value={value}
                    onChange={handleSelectChange}
                    required
                    className='mt-1 w-full rounded border px-3 py-2'
                >
                    <option value=''>Select a category</option>
                    {categories?.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                    <option value={NEW_CATEGORY_VALUE}>+ Add new category</option>
                </select>
            )}
        </div>
    );
}
