import Link from 'next/link';

import { SignOutButton } from '@/components/SignOutButton';

export function Nav() {
    return (
        <header className='border-b px-4 py-3'>
            <div className='mx-auto flex max-w-4xl items-center justify-between'>
                <Link href='/' className='text-lg font-semibold'>
                    Recipe Manager
                </Link>

                <SignOutButton />
            </div>
        </header>
    );
}
