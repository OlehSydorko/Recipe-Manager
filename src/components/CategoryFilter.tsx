'use client';

import { CategoryDropdown } from '@/components/CategoryDropdown';
import { useDeleteCategory } from '@/hooks/useCategories';
import type { Category } from '@/types/category';

type CategoryFilterProps = {
    categories: Category[] | undefined;
    value: string;
    onChange: (categoryId: string) => void;
};

export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
    const deleteCategory = useDeleteCategory();

    const handleDeleteCategory = (category: Category) => {
        deleteCategory.mutate(category.id, {
            onSuccess: () => {
                if (value === category.id) {
                    onChange('');
                }
            },
            onError: (error) => {
                // Native alert is the simplest error surface here; no toast/notification
                // component exists in the app yet to replace it with.
                // eslint-disable-next-line no-alert
                window.alert(error instanceof Error ? error.message : 'Could not delete category.');
            }
        });
    };

    return (
        <CategoryDropdown
            ariaLabel='Filter by category'
            categories={categories}
            value={value}
            placeholderLabel='All categories'
            onChange={onChange}
            onDeleteCategory={handleDeleteCategory}
        />
    );
}
