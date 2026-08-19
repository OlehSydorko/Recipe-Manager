'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { TextLineSkeleton } from '@/components/ui/Skeleton';
import { FollowButton } from '@/features/social/components/FollowButton';
import { useSearchProfiles } from '@/hooks/useProfile';
import { Search } from 'lucide-react';
import { ProfileListItem } from './ProfileListItem';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

// Debounces the raw input so useSearchProfiles (and the query it fires)
// only runs once typing pauses, not on every keystroke.
function useDebouncedValue(value: string, delayMs: number): string {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebounced(value), delayMs);

        return () => clearTimeout(timeoutId);
    }, [value, delayMs]);

    return debounced;
}

type FindPeopleSearchProps = {
    // Only relevant when this is mounted at /people -- the route's ?q=, set
    // by the global nav search's fallback submit (see GlobalSearch), or by
    // a person typing directly into this page's own search box on a fresh
    // load via a shared link.
    initialQuery?: string;
};

export function FindPeopleSearch({ initialQuery = '' }: FindPeopleSearchProps) {
    const [query, setQuery] = useState(initialQuery);
    const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
    const { data: results, isPending, isFetching } = useSearchProfiles(debouncedQuery);

    // Resyncs when the URL's ?q= changes after the initial mount -- e.g. the
    // global nav search deep-links here while the user is already on this
    // page, which the useState initializer above alone wouldn't pick up.
    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const trimmedQuery = query.trim();
    const isBelowMinLength = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
    const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH;
    const isLoading = isSearching && (isPending || isFetching);

    return (
        <div>
            <h1 className='text-display font-semibold text-text-primary'>Discover</h1>
            <p className='mt-1 text-body text-text-secondary'>Find other users by their name.</p>

            <div className='relative mt-5 max-w-md'>
                <Search size={16} className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled' />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder='Search by name…'
                    className='pl-9'
                    aria-label='Search for people by name'
                />
            </div>

            {isBelowMinLength && (
                <p className='mt-4 text-caption text-text-disabled'>Keep typing — at least 2 characters.</p>
            )}

            {isLoading && (
                <div className='mt-4 space-y-3'>
                    <TextLineSkeleton className='w-2/3' />
                    <TextLineSkeleton className='w-1/2' />
                    <TextLineSkeleton className='w-3/5' />
                </div>
            )}

            {!isLoading && isSearching && results?.length === 0 && (
                <p className='mt-4 text-body text-text-secondary'>No one found matching &quot;{trimmedQuery}&quot;.</p>
            )}

            {!isLoading && isSearching && results && results.length > 0 && (
                <div className='mt-4 max-w-md divide-y divide-border'>
                    {results.map((profile) => (
                        <ProfileListItem key={profile.id} profile={profile} action={<FollowButton userId={profile.id} />} />
                    ))}
                </div>
            )}
        </div>
    );
}
