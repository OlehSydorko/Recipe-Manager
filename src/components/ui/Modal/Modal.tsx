'use client';

import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.scss';

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
        <div role='presentation' onClick={onClose} className={`animate-fade-in ${styles.backdrop}`}>
            <div
                role='dialog'
                aria-modal='true'
                aria-labelledby='modal-title'
                onClick={(event) => event.stopPropagation()}
                className={`animate-scale-in ${styles.dialog}`}
            >
                <h2 id='modal-title' className={styles.title}>
                    {title}
                </h2>

                <div className='mt-2 text-body text-text-secondary'>{children}</div>

                {footer && <div className='mt-6 flex justify-end gap-2'>{footer}</div>}
            </div>
        </div>,
        document.body
    );
}
