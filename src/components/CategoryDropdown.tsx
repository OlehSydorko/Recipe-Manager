'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown, IconX } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { type Category, DEFAULT_CATEGORY_COUNT } from '@/types/category';

type CategoryDropdownProps = {
    id?: string;
    ariaLabel?: string;
    categories: Category[] | undefined;
    value: string;
    placeholderLabel: string;
    onChange: (categoryId: string) => void;
    onDeleteCategory?: (category: Category) => void;
    footer?: ReactNode;
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
    const [categoryPendingDelete, setCategoryPendingDelete] = useState<Category | null>(null);
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

    const handleDeleteClick = (event: React.MouseEvent, category: Category) => {
        event.stopPropagation();

        if (!onDeleteCategory) {
            return;
        }

        setCategoryPendingDelete(category);
    };

    const handleConfirmDelete = () => {
        if (categoryPendingDelete && onDeleteCategory) {
            onDeleteCategory(categoryPendingDelete);
        }

        setCategoryPendingDelete(null);
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
                className='flex h-11 w-full items-center justify-between rounded-sm border border-border bg-bg-secondary px-3 text-left text-body transition-colors duration-150 hover:border-border-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15'
            >
                <span className={value ? 'text-text-primary' : 'text-text-disabled'}>{selectedLabel}</span>
                <IconChevronDown size={16} className='shrink-0 text-text-secondary' />
            </button>

            {isOpen && (
                <ul
                    role='listbox'
                    className='animate-dropdown-in absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-md border border-border bg-surface-elevated py-1.5 text-body shadow-md'
                >
                    <li role='option' aria-selected={value === ''}>
                        <button
                            type='button'
                            onClick={() => handleSelect('')}
                            className='w-full px-3 py-2 text-left text-text-secondary transition-colors duration-150 hover:bg-hover'
                        >
                            {placeholderLabel}
                        </button>
                    </li>

                    {categories?.map((category) => {
                        const isSelected = value === category.id;

                        return (
                            <li
                                key={category.id}
                                role='option'
                                aria-selected={isSelected}
                                className='flex items-center'
                            >
                                <button
                                    type='button'
                                    onClick={() => handleSelect(category.id)}
                                    className={`flex flex-1 items-center justify-between gap-2 px-3 py-2 text-left transition-colors duration-150 hover:bg-hover ${
                                        isSelected ? 'text-accent' : 'text-text-primary'
                                    }`}
                                >
                                    {category.name}
                                    {isSelected && <IconCheck size={15} />}
                                </button>

                                {onDeleteCategory && !defaultCategoryIds.has(category.id) && (
                                    <button
                                        type='button'
                                        aria-label={`Delete ${category.name}`}
                                        onClick={(event) => handleDeleteClick(event, category)}
                                        className='mr-1.5 shrink-0 rounded-sm p-1.5 text-text-disabled transition-colors duration-150 hover:bg-error-muted hover:text-error'
                                    >
                                        <IconX size={14} />
                                    </button>
                                )}
                            </li>
                        );
                    })}

                    {footer}
                </ul>
            )}

            <Modal
                open={Boolean(categoryPendingDelete)}
                onClose={() => setCategoryPendingDelete(null)}
                title='Delete category?'
                footer={
                    <>
                        <Button variant='secondary' onClick={() => setCategoryPendingDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant='danger' onClick={handleConfirmDelete}>
                            Delete
                        </Button>
                    </>
                }
            >
                {categoryPendingDelete ? `Delete "${categoryPendingDelete.name}"? This can't be undone.` : null}
            </Modal>
        </div>
    );
}
