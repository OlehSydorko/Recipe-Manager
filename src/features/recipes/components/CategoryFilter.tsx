'use client';

import { Star } from 'lucide-react';

// Loose enough to accept either a real Category (My Recipes tab) or a
// synthesized { id: name, name } option list derived from community
// recipes' categoryName (Community tab has no access to the viewer's own
// owner-scoped categories table).
type CategoryFilterOption = {
    id: string;
    name: string;
};

type CategoryFilterProps = {
    categories: CategoryFilterOption[] | undefined;
    value: string;
    onChange: (categoryId: string) => void;
    showFavoritesOnly: boolean;
    onToggleFavoritesOnly: () => void;
};

const CHIP_BASE_CLASSES =
    'inline-flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-1.5 text-label font-medium transition-colors duration-150';
const CHIP_ACTIVE_CLASSES = 'border-accent bg-accent-muted text-accent';
const CHIP_INACTIVE_CLASSES =
    'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary';

export function CategoryFilter({
    categories,
    value,
    onChange,
    showFavoritesOnly,
    onToggleFavoritesOnly
}: CategoryFilterProps) {
    return (
        <div
            role='group'
            aria-label='Filter recipes'
            className='flex flex-nowrap gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible'
        >
            <button
                type='button'
                aria-pressed={value === ''}
                onClick={() => onChange('')}
                className={`${CHIP_BASE_CLASSES} ${value === '' ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
            >
                All
            </button>

            <button
                type='button'
                aria-pressed={showFavoritesOnly}
                onClick={onToggleFavoritesOnly}
                className={`${CHIP_BASE_CLASSES} ${showFavoritesOnly ? CHIP_ACTIVE_CLASSES : CHIP_INACTIVE_CLASSES}`}
            >
                <Star size={14} className={showFavoritesOnly ? 'fill-current' : ''} />
                Favorites
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
