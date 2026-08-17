'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AuthGateModalProps = {
    open: boolean;
    onClose: () => void;
    redirectTo: string;
    message?: string;
};

// Soft authentication gate: shown instead of blocking a page outright when a
// guest attempts an account-only action (favorite, follow, save to
// collection, create...). Carries the current path as a redirect param so
// signing in returns the visitor to where they were, instead of just
// dropping them on Home.
export function AuthGateModal({ open, onClose, redirectTo, message }: AuthGateModalProps) {
    const router = useRouter();
    const query = `?redirect=${encodeURIComponent(redirectTo)}`;

    const handleSignIn = () => {
        onClose();
        router.push(`/login${query}`);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title='Sign in required'
            footer={
                <>
                    <Button variant='secondary' onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant='primary' onClick={handleSignIn}>
                        Sign In
                    </Button>
                </>
            }
        >
            <p>{message ?? 'Create a free account to do that.'}</p>
            <p className='mt-2'>
                Don&apos;t have an account?{' '}
                <Link
                    href={`/signup${query}`}
                    onClick={onClose}
                    className='font-medium text-accent hover:text-accent-hover'
                >
                    Sign up
                </Link>
            </p>
        </Modal>
    );
}
