'use client';

import { signOut } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        // Land on the homepage in its logged-out state -- not /login. The
        // AuthListener has already cleared the query cache by this point, so
        // the guest UI is correct as soon as we get there.
        router.push('/');
        router.refresh();
    };

    return (
        <Button variant='ghost' onClick={handleSignOut}>
            <LogOut size={15} />
            Sign out
        </Button>
    );
}
