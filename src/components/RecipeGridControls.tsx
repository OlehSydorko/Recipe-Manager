'use client';

import { LayoutGrid, List } from 'lucide-react';

export type RecipeSortOption = 'newest' | 'oldest' | 'title';
export type RecipeViewMode = 'grid' | 'list';

const SORT_LABELS: Record<RecipeSortOption, string> = {
    newest: 'Newest first',
    oldest: 'Oldest first',
    title: 'Title A–Z'
};

const SORT_OPTIONS = Object.keys(SORT_LABELS) as RecipeSortOption[];

type RecipeGridControlsProps = {
    sortBy: RecipeSortOption;
    onSortChange: (sort: RecipeSortOption) => void;
    viewMode: RecipeViewMode;
    onViewModeChange: (mode: RecipeViewMode) => void;
};

export function RecipeGridControls({ sortBy, onSortChange, viewMode, onViewModeChange }: RecipeGridControlsProps) {
    return (
        <div className='flex items-center gap-3'>
            <select
                aria-label='Sort recipes'
                value={sortBy}
                onChange={(event) => onSortChange(event.target.value as RecipeSortOption)}
                className='h-10 rounded-md border border-border bg-bg-secondary px-3 text-label text-text-primary transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15'
            >
                {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                        {SORT_LABELS[option]}
                    </option>
                ))}
            </select>

            <div role='group' aria-label='Recipe view' className='flex overflow-hidden rounded-md border border-border'>
                <button
                    type='button'
                    aria-pressed={viewMode === 'grid'}
                    aria-label='Grid view'
                    onClick={() => onViewModeChange('grid')}
                    className={`flex h-10 w-10 items-center justify-center transition-colors duration-150 ${
                        viewMode === 'grid' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:bg-hover'
                    }`}
                >
                    <LayoutGrid size={16} />
                </button>
                <button
                    type='button'
                    aria-pressed={viewMode === 'list'}
                    aria-label='List view'
                    onClick={() => onViewModeChange('list')}
                    className={`flex h-10 w-10 items-center justify-center border-l border-border transition-colors duration-150 ${
                        viewMode === 'list' ? 'bg-accent-muted text-accent' : 'text-text-secondary hover:bg-hover'
                    }`}
                >
                    <List size={16} />
                </button>
            </div>
        </div>
    );
}
