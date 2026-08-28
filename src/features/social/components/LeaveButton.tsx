'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DEFAULT_CONFIRM_MESSAGE = 'You have unsaved changes. Leave without saving?';

type LeaveButtonProps = {
    to?: string;
    isDirty?: boolean;
    disabled?: boolean;
    confirmMessage?: string;
};

export function LeaveButton({
    to = '/recipes',
    isDirty = false,
    disabled = false,
    confirmMessage = DEFAULT_CONFIRM_MESSAGE
}: LeaveButtonProps) {
    const router = useRouter();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleLeaveClick = () => {
        if (isDirty) {
            setIsConfirmOpen(true);

            return;
        }

        router.push(to);
    };

    const handleConfirmLeave = () => {
        setIsConfirmOpen(false);
        router.push(to);
    };

    return (
        <>
            <button
                type='button'
                onClick={handleLeaveClick}
                disabled={disabled}
                className='fixed bottom-20 right-6 z-20 flex items-center gap-2 rounded-full bg-surface-elevated px-5 py-3 text-button font-medium text-text-primary shadow-lg transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 sm:bottom-6'
            >
                <ArrowLeft size={16} />
                Leave
            </button>

            <Modal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title='Leave without saving?'
                footer={
                    <>
                        <Button variant='secondary' onClick={() => setIsConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant='danger' onClick={handleConfirmLeave}>
                            Leave
                        </Button>
                    </>
                }
            >
                {confirmMessage}
            </Modal>
        </>
    );
}
