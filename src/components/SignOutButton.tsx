'use client';

import { useRouter } from 'next/navigation';

import { signOut } from '@/api/auth';

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <button onClick={handleSignOut} className='rounded border px-3 py-2 text-sm'>
            Sign out
        </button>
    );
}
