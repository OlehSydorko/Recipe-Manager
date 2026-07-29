'use client';

import { useState } from 'react';

import { CategoryDropdown } from '@/components/CategoryDropdown';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import type { Category } from '@/types/category';

type CategorySelectProps = {
    value: string;
    onChange: (categoryId: string) => void;
};

export function CategorySelect({ value, onChange }: CategorySelectProps) {
    const { data: categories, isPending } = useCategories();
    const createCategory = useCreateCategory();
    const deleteCategory = useDeleteCategory();
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

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

    const handleDeleteCategory = (category: Category) => {
        deleteCategory.mutate(category.id, {
            onSuccess: () => {
                if (value === category.id) {
                    onChange('');
                }
            },
            onError: (error) => {
                window.alert(error instanceof Error ? error.message : 'Could not delete category.');
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
                <div className='mt-1'>
                    <CategoryDropdown
                        id='category'
                        categories={categories}
                        value={value}
                        placeholderLabel='Select a category'
                        onChange={onChange}
                        onDeleteCategory={handleDeleteCategory}
                        footer={
                            <li>
                                <button
                                    type='button'
                                    onClick={() => setIsCreating(true)}
                                    className='w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50'
                                >
                                    + Add new category
                                </button>
                            </li>
                        }
                    />
                </div>
            )}
        </div>
    );
}
