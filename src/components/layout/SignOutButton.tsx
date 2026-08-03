'use client';

import { signOut } from '@/API/auth';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
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
            <LogOut size={16} />
            Sign out
        </Button>
    );
}
