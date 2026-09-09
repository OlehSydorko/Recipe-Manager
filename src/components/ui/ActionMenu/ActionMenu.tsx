'use client';

import { useEffect, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Pencil } from 'lucide-react';
import styles from './ActionMenu.module.scss';

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
                <Pencil size={18} />
            </IconButton>

            {isOpen && (
                <ul role='menu' aria-label={ariaLabel} className={`animate-dropdown-in ${styles.menu}`}>
                    {items.map((item, index) => (
                        <li key={item.label} role='none'>
                            <button
                                ref={(node) => {
                                    itemRefs.current[index] = node;
                                }}
                                type='button'
                                role='menuitem'
                                onClick={() => handleSelect(item)}
                                className={`${styles.menuItem} ${item.variant === 'danger' ? styles.danger : ''}`}
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
