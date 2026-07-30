'use client';

import { useRouter } from 'next/navigation';

const DEFAULT_CONFIRM_MESSAGE = 'You have unsaved changes. Leave without saving?';

type LeaveButtonProps = {
    to?: string;
    isDirty?: boolean;
    disabled?: boolean;
    confirmMessage?: string;
};

// Fixed bottom-right exit for any "recipe is open" view: detail, edit, or new.
// Confirms via a native dialog when `isDirty` is true, otherwise navigates immediately.
export function LeaveButton({
    to = '/recipes',
    isDirty = false,
    disabled = false,
    confirmMessage = DEFAULT_CONFIRM_MESSAGE
}: LeaveButtonProps) {
    const router = useRouter();

    const handleLeave = () => {
        // Native confirm is the simplest guard against losing unsaved changes here;
        // no custom modal component exists in the app yet to replace it with.
        // eslint-disable-next-line no-alert
        if (isDirty && !window.confirm(confirmMessage)) {
            return;
        }

        router.push(to);
    };

    return (
        <button
            type='button'
            onClick={handleLeave}
            disabled={disabled}
            className='fixed bottom-6 right-6 z-10 rounded bg-black px-4 py-2 text-sm text-white shadow-lg hover:bg-gray-800 disabled:opacity-50'
        >
            Leave
        </button>
    );
}
