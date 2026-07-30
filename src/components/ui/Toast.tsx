'use client';

import { type ReactNode, createContext, useCallback, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'warning';

type ToastItem = {
    id: string;
    type: ToastType;
    message: string;
};

type ToastContextValue = {
    showToast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_BORDER_CLASSES: Record<ToastType, string> = {
    success: 'border-l-success',
    error: 'border-l-error',
    warning: 'border-l-warning'
};

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = crypto.randomUUID();

        setToasts((previous) => [...previous, { id, type, message }]);

        setTimeout(() => {
            setToasts((previous) => previous.filter((toast) => toast.id !== id));
        }, AUTO_DISMISS_MS);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            <div aria-live='polite' className='pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2'>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role='status'
                        className={`animate-fade-in pointer-events-auto w-72 rounded-md border-l-4 bg-surface-elevated px-4 py-3 text-body text-text-primary shadow-lg ${TYPE_BORDER_CLASSES[toast.type]}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    return context;
}
