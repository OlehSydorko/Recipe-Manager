'use client';

import { useEffect, useRef, useState } from 'react';
import { type Category, DEFAULT_CATEGORY_COUNT } from '@/types/category';

type CategoryDropdownProps = {
    id?: string;
    ariaLabel?: string;
    categories: Category[] | undefined;
    value: string;
    placeholderLabel: string;
    onChange: (categoryId: string) => void;
    onDeleteCategory?: (category: Category) => void;
    footer?: React.ReactNode;
};

// Custom listbox instead of a native <select> — a native <option> can't host
// a delete button, so this renders each category as a row with the name as
// one button and, for non-default categories, a small delete button on the right.
export function CategoryDropdown({
    id,
    ariaLabel,
    categories,
    value,
    placeholderLabel,
    onChange,
    onDeleteCategory,
    footer
}: CategoryDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = categories?.find((category) => category.id === value)?.name ?? placeholderLabel;

    // categories is already sorted oldest-first (see getCategories), so the
    // first DEFAULT_CATEGORY_COUNT rows are the ones seeded at signup.
    const defaultCategoryIds = new Set(categories?.slice(0, DEFAULT_CATEGORY_COUNT).map((category) => category.id));

    const handleSelect = (categoryId: string) => {
        onChange(categoryId);
        setIsOpen(false);
    };

    const handleDelete = (event: React.MouseEvent, category: Category) => {
        event.stopPropagation();

        if (!onDeleteCategory) {
            return;
        }

        // A native confirm is the simplest guard against an accidental delete here;
        // no custom modal component exists in the app yet to replace it with.
        // eslint-disable-next-line no-alert
        if (!window.confirm(`Delete "${category.name}"? This can't be undone.`)) {
            return;
        }

        onDeleteCategory(category);
    };

    return (
        <div ref={containerRef} className='relative'>
            <button
                id={id}
                type='button'
                aria-label={ariaLabel}
                aria-haspopup='listbox'
                aria-expanded={isOpen}
                onClick={() => setIsOpen((previous) => !previous)}
                className='w-full rounded border px-3 py-2 text-left text-sm'
            >
                {selectedLabel}
            </button>

            {isOpen && (
                <ul
                    role='listbox'
                    className='absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded border bg-white text-sm shadow-lg'
                >
                    <li role='option' aria-selected={value === ''}>
                        <button
                            type='button'
                            onClick={() => handleSelect('')}
                            className='w-full px-3 py-2 text-left hover:bg-gray-50'
                        >
                            {placeholderLabel}
                        </button>
                    </li>

                    {categories?.map((category) => (
                        <li
                            key={category.id}
                            role='option'
                            aria-selected={value === category.id}
                            className='flex items-center justify-between'
                        >
                            <button
                                type='button'
                                onClick={() => handleSelect(category.id)}
                                className='flex-1 px-3 py-2 text-left hover:bg-gray-50'
                            >
                                {category.name}
                            </button>

                            {onDeleteCategory && !defaultCategoryIds.has(category.id) && (
                                <button
                                    type='button'
                                    aria-label={`Delete ${category.name}`}
                                    onClick={(event) => handleDelete(event, category)}
                                    className='mr-2 shrink-0 rounded px-1.5 py-0.5 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600'
                                >
                                    ✕
                                </button>
                            )}
                        </li>
                    ))}

                    {footer}
                </ul>
            )}
        </div>
    );
}
