'use client';

import type { ButtonHTMLAttributes } from 'react';

type IconButtonVariant = 'default' | 'danger';

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
    default: 'text-text-secondary hover:bg-hover hover:text-text-primary',
    danger: 'text-text-secondary hover:bg-error-muted hover:text-error'
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    'aria-label': string;
    variant?: IconButtonVariant;
};

export function IconButton({ variant = 'default', className, children, ...rest }: IconButtonProps) {
    return (
        <button
            type='button'
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${className ?? ''}`}
            {...rest}
        >
            {children}
        </button>
    );
}
