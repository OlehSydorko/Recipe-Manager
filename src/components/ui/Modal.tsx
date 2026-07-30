'use client';

import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            role='presentation'
            onClick={onClose}
            className='animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm'
        >
            <div
                role='dialog'
                aria-modal='true'
                aria-labelledby='modal-title'
                onClick={(event) => event.stopPropagation()}
                className='animate-scale-in w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-6 shadow-lg'
            >
                <h2 id='modal-title' className='text-h3 font-semibold text-text-primary'>
                    {title}
                </h2>

                <div className='mt-2 text-body text-text-secondary'>{children}</div>

                {footer && <div className='mt-6 flex justify-end gap-2'>{footer}</div>}
            </div>
        </div>,
        document.body
    );
}
