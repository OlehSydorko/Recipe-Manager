'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HomeSearchBar() {
    const router = useRouter();

    const [search, setSearch] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (search.trim().length === 0) {
            return;
        }

        router.push(`/recipes?q=${encodeURIComponent(search)}`);
    };

    return (
        <div className='relative hidden max-w-sm flex-1 sm:block'>
            <form onSubmit={handleSubmit}>
                <Search
                    size={17}
                    className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled'
                />
                <input
                    type='search'
                    onChange={(event) => setSearch(event.target.value)}
                    value={search}
                    placeholder='Search recipes'
                    className='h-10 w-full rounded-full border border-border bg-bg-secondary pl-10 pr-4 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60'
                />
            </form>
        </div>
    );
}
