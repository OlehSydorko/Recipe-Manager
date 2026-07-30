'use client';

import type { Category } from '@/types/category';

type CategoryFilterProps = {
    categories: Category[] | undefined;
    value: string;
    onChange: (categoryId: string) => void;
};

const CHIP_BASE_CLASSES = 'rounded-full border px-3.5 py-1.5 text-label font-medium transition-colors duration-150';
const CHIP_ACTIVE_CLASSES = 'border-accent bg-accent-muted text-accent';
const CHIP_INACTIVE_CLASSES =
    'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary';

// Category management (rename/delete) lives in CategorySelect (used from the recipe
// form) — this filter is select-only chips, matching how filters read elsewhere in the app.
export function CategoryFilter({ categories, value, onChange }: CategoryFilterProps) {
    return (
        <div role='group' aria-label='Filter by category' className='flex flex-wrap gap-2'>
            <button
                type='button'
                aria-pressed={value === ''}
                onClick={() => onChange('')}
                className={`${CHIP_BASE_CLASSES} ${value === '' ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
            >
                All
            </button>

            {categories?.map((category) => {
                const isActive = value === category.id;

                return (
                    <button
                        key={category.id}
                        type='button'
                        aria-pressed={isActive}
                        onClick={() => onChange(isActive ? '' : category.id)}
                        className={`${CHIP_BASE_CLASSES} ${isActive ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}
