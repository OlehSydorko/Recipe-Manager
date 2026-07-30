'use client';

import { signOut } from '@/API/auth';
import { IconLogOut } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <Button variant='ghost' onClick={handleSignOut}>
            <IconLogOut size={16} />
            Sign out
        </Button>
    );
}
