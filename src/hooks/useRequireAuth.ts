'use client';

import { createElement, useState } from 'react';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { usePathname } from 'next/navigation';
import { useCurrentProfile } from './useProfile';

export function useRequireAuth(message?: string) {
    const { data: profile, isPending } = useCurrentProfile();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const isGuest = !isPending && !profile;

    const requireAuth = (action: () => void) => {
        if (isGuest) {
            setIsOpen(true);

            return;
        }

        action();
    };

    const authGate = createElement(AuthGateModal, {
        open: isOpen,
        onClose: () => setIsOpen(false),
        redirectTo: pathname,
        message
    });

    return { isGuest, requireAuth, authGate };
}
