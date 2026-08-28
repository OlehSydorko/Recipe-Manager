'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { CategoryDropdown } from '@/features/recipes/components/CategoryDropdown';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/useCategories';
import type { Category } from '@/types/category';

type CategorySelectProps = {
    value: string;
    onChange: (categoryId: string) => void;
    error?: string;
};

export function CategorySelect({ value, onChange, error }: CategorySelectProps) {
    const { data: categories, isPending } = useCategories();
    const createCategory = useCreateCategory();
    const deleteCategory = useDeleteCategory();
    const { showToast } = useToast();
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
                showToast('error', error instanceof Error ? error.message : 'Could not delete category.');
            }
        });
    };

    if (isPending) {
        return <p className='text-body text-text-secondary'>Loading categories…</p>;
    }

    return (
        <div>
            <label htmlFor='category' className='mb-1.5 block text-label font-medium text-text-secondary'>
                Category
            </label>

            {isCreating ? (
                <div className='flex gap-2'>
                    <Input
                        value={newCategoryName}
                        onChange={(event) => setNewCategoryName(event.target.value)}
                        placeholder='New category name'
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        className='flex-1'
                    />
                    <Button variant='primary' onClick={handleCreateCategory} disabled={createCategory.isPending}>
                        Add
                    </Button>
                    <Button variant='secondary' onClick={() => setIsCreating(false)}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <CategoryDropdown
                    id='category'
                    ariaInvalid={Boolean(error)}
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
                                className='w-full px-3 py-2 text-left text-body text-accent transition-colors duration-150 hover:bg-hover'
                            >
                                + Add new category
                            </button>
                        </li>
                    }
                />
            )}

            {error && <p className='mt-1.5 text-body text-error'>{error}</p>}
        </div>
    );
}
