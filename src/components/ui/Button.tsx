'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BASE_CLASSES =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2.5 text-button font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98]';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
    primary: 'bg-accent text-accent-foreground shadow-sm hover:bg-accent-hover hover:shadow-md active:bg-accent-active',
    secondary: 'border border-border-strong text-text-primary hover:bg-hover',
    ghost: 'text-text-secondary hover:bg-hover hover:text-text-primary',
    danger: 'border border-error/40 text-error hover:bg-error-muted'
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
    children: ReactNode;
};

export function Button({ variant = 'secondary', fullWidth, className, children, ...rest }: ButtonProps) {
    return (
        <button
            type='button'
            className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${fullWidth ? 'w-full' : ''} ${className ?? ''}`}
            {...rest}
        >
            {children}
        </button>
    );
}
