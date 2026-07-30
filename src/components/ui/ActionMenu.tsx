'use client';

import { useEffect, useRef, useState } from 'react';
import { IconPencil } from '@/components/icons';
import { IconButton } from '@/components/ui/IconButton';

export type ActionMenuItem = {
    label: string;
    onSelect: () => void;
    variant?: 'default' | 'danger';
};

type ActionMenuProps = {
    ariaLabel: string;
    items: ActionMenuItem[];
};

export function ActionMenu({ ariaLabel, items }: ActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);

                return;
            }

            if (event.key === 'ArrowDown') {
                event.preventDefault();
                setActiveIndex((previous) => (previous + 1) % items.length);
            }

            if (event.key === 'ArrowUp') {
                event.preventDefault();
                setActiveIndex((previous) => (previous - 1 + items.length) % items.length);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, items.length]);

    useEffect(() => {
        if (isOpen) {
            itemRefs.current[activeIndex]?.focus();
        }
    }, [isOpen, activeIndex]);

    const handleTriggerClick = () => {
        setActiveIndex(0);
        setIsOpen((previous) => !previous);
    };

    const handleSelect = (item: ActionMenuItem) => {
        setIsOpen(false);
        item.onSelect();
    };

    return (
        <div ref={containerRef} className='relative'>
            <IconButton aria-label={ariaLabel} aria-haspopup='menu' aria-expanded={isOpen} onClick={handleTriggerClick}>
                <IconPencil size={18} />
            </IconButton>

            {isOpen && (
                <ul
                    role='menu'
                    aria-label={ariaLabel}
                    className='animate-dropdown-in absolute right-0 z-20 mt-2 w-40 origin-top-right rounded-md border border-border bg-surface-elevated py-1.5 shadow-md'
                >
                    {items.map((item, index) => (
                        <li key={item.label} role='none'>
                            <button
                                ref={(node) => {
                                    itemRefs.current[index] = node;
                                }}
                                type='button'
                                role='menuitem'
                                onClick={() => handleSelect(item)}
                                className={`block w-full px-3 py-2 text-left text-body transition-colors duration-150 hover:bg-hover ${
                                    item.variant === 'danger' ? 'text-error' : 'text-text-primary'
                                }`}
                            >
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
