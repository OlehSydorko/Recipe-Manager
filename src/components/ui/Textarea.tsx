'use client';

import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...rest }: TextareaProps) {
    return (
        <textarea
            className={`w-full resize-y rounded-md border border-border bg-bg-secondary px-3 py-2.5 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50 ${className ?? ''}`}
            {...rest}
        />
    );
}
