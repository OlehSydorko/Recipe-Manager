import { SignOutButton } from '@/components/layout/SignOutButton';
import { Search } from 'lucide-react';
import Link from 'next/link';

export function Nav() {
    return (
        <header className='sticky top-0 z-30 border-b border-border bg-bg-secondary'>
            <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6'>
                <Link href='/' className='shrink-0 text-h3 font-semibold text-text-primary'>
                    Recipe Manager
                </Link>

                <div className='relative hidden max-w-sm flex-1 sm:block'>
                    <Search
                        size={17}
                        className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled'
                    />
                    <input
                        type='search'
                        placeholder='Search recipes'
                        disabled
                        aria-label='Search recipes'
                        title='Search is coming soon'
                        className='h-10 w-full rounded-full border border-border bg-bg-secondary pl-10 pr-4 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60'
                    />
                </div>

                <div className='ml-auto shrink-0'>
                    <SignOutButton />
                </div>
            </div>
        </header>
    );
}
