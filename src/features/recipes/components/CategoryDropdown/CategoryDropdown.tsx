'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal/Modal';
import { type Category, DEFAULT_CATEGORY_COUNT } from '@/types/category';
import { Check, ChevronDown, X } from 'lucide-react';
import styles from './CategoryDropdown.module.scss';

type CategoryDropdownProps = {
    id?: string;
    ariaLabel?: string;
    ariaInvalid?: boolean;
    categories: Category[] | undefined;
    value: string;
    placeholderLabel: string;
    onChange: (categoryId: string) => void;
    onDeleteCategory?: (category: Category) => void;
    footer?: ReactNode;
};

export function CategoryDropdown({
    id,
    ariaLabel,
    ariaInvalid,
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
                aria-invalid={ariaInvalid}
                onClick={() => setIsOpen((previous) => !previous)}
                className={styles.trigger}
            >
                <span className={value ? 'text-text-primary' : 'text-text-disabled'}>{selectedLabel}</span>
                <ChevronDown size={16} className='shrink-0 text-text-secondary' />
            </button>

            {isOpen && (
                <ul role='listbox' className={`animate-dropdown-in ${styles.listbox}`}>
                    <li role='option' aria-selected={value === ''}>
                        <button type='button' onClick={() => handleSelect('')} className={styles.placeholderButton}>
                            {placeholderLabel}
                        </button>
                    </li>

                    {categories?.map((category) => {
                        const isSelected = value === category.id;

                        return (
                            <li key={category.id} role='option' aria-selected={isSelected} className='flex items-center'>
                                <button
                                    type='button'
                                    onClick={() => handleSelect(category.id)}
                                    className={`${styles.optionButton} ${isSelected ? styles.selected : ''}`}
                                >
                                    {category.name}
                                    {isSelected && <Check size={15} />}
                                </button>

                                {onDeleteCategory && !defaultCategoryIds.has(category.id) && (
                                    <button
                                        type='button'
                                        aria-label={`Delete ${category.name}`}
                                        onClick={(event) => handleDeleteClick(event, category)}
                                        className={styles.deleteButton}
                                    >
                                        <X size={14} />
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
