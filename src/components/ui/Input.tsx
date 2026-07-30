'use client';

import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...rest }: InputProps) {
    return (
        <input
            className={`h-11 w-full rounded-sm border border-border bg-bg-secondary px-3 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
            {...rest}
        />
    );
}
