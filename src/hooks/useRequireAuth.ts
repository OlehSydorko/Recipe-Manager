'use client';

import { createElement, useState } from 'react';
import { AuthGateModal } from '@/components/auth/AuthGateModal';
import { usePathname } from 'next/navigation';
import { useCurrentProfile } from './useProfile';

// Shared "soft gate" for account-only actions (favorite, follow, save to
// collection, create recipe/collection, ...) on pages that are otherwise
// public. Instead of the page itself redirecting a guest away, the action
// component calls requireAuth(doTheThing) -- guests see the auth-gate modal,
// everyone else runs the action normally. Rendering `authGate` wherever the
// component returns JSX wires up the modal without every caller needing its
// own open/close state.
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
