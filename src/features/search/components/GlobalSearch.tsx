'use client';

import { useEffect, useRef, useState } from 'react';
import { useAvatarUrl } from '@/hooks/useProfile';
import { useGlobalSearch } from '@/hooks/useSearch';
import type { Profile } from '@/types/profile';
import { BookOpen, Folder, Search, User, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

type SuggestionKind = 'recipe' | 'collection' | 'person';

type FlatSuggestion = {
    kind: SuggestionKind;
    id: string;
    label: string;
};

const DESTINATION_BY_KIND: Record<SuggestionKind, string> = {
    recipe: '/recipes',
    collection: '/collections',
    person: '/profile'
};

// Debounces the raw input so useGlobalSearch (and the query it fires) only
// runs once typing pauses, not on every keystroke -- same pattern as
// FindPeopleSearch's local debounce hook.
function useDebouncedValue(value: string, delayMs: number): string {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebounced(value), delayMs);

        return () => clearTimeout(timeoutId);
    }, [value, delayMs]);

    return debounced;
}

type SuggestionRowProps = {
    icon: LucideIcon;
    label: string;
    isHighlighted: boolean;
    onClick: () => void;
};

function SuggestionRow({ icon: Icon, label, isHighlighted, onClick }: SuggestionRowProps) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-body transition-colors duration-150 ${
                isHighlighted ? 'bg-hover text-text-primary' : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
        >
            <Icon size={16} className='shrink-0 text-text-disabled' />
            <span className='truncate'>{label}</span>
        </button>
    );
}

type PersonSuggestionRowProps = {
    profile: Profile;
    isHighlighted: boolean;
    onClick: () => void;
};

// Same avatar-or-fallback-icon treatment as ProfileListItem on the Discover
// page, so a person result reads the same way wherever it shows up.
function PersonSuggestionRow({ profile, isHighlighted, onClick }: PersonSuggestionRowProps) {
    const { data: avatarUrl } = useAvatarUrl(profile.avatar_url);

    return (
        <button
            type='button'
            onClick={onClick}
            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-body transition-colors duration-150 ${
                isHighlighted ? 'bg-hover text-text-primary' : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
        >
            <span className='flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-secondary'>
                {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={avatarUrl}
                        alt={profile.display_name ?? 'Profile photo'}
                        className='h-full w-full object-cover'
                    />
                ) : (
                    <User size={14} className='text-text-disabled' />
                )}
            </span>
            <span className='truncate'>{profile.display_name || 'Unnamed'}</span>
        </button>
    );
}

type SuggestionGroupProps = {
    label: string;
    children: React.ReactNode;
};

function SuggestionGroup({ label, children }: SuggestionGroupProps) {
    return (
        <div className='border-b border-border py-1.5 last:border-b-0'>
            <p className='px-4 py-1 text-caption font-medium uppercase tracking-wide text-text-disabled'>{label}</p>
            {children}
        </div>
    );
}

type GlobalSearchProps = {
    className?: string;
    autoFocus?: boolean;
    onNavigate?: () => void;
};

// Unified search mounted in the nav -- suggests matching recipes,
// collections, and people as the user types, and either jumps straight to a
// specific suggestion or, on plain submit, falls back to the recipes list
// filtered by the typed query.
export function GlobalSearch({ className, autoFocus = false, onNavigate }: GlobalSearchProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
    const { data: results, isPending, isFetching } = useGlobalSearch(debouncedQuery);

    const trimmedQuery = query.trim();
    const isBelowMinLength = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
    const isSearching = trimmedQuery.length >= MIN_QUERY_LENGTH;
    const isLoading = isSearching && (isPending || isFetching);

    const flatSuggestions: FlatSuggestion[] = [
        ...(results?.recipes.map((recipe) => ({ kind: 'recipe' as const, id: recipe.id, label: recipe.title })) ?? []),
        ...(results?.collections.map((collection) => ({
            kind: 'collection' as const,
            id: collection.id,
            label: collection.name
        })) ?? []),
        ...(results?.people.map((person) => ({
            kind: 'person' as const,
            id: person.id,
            label: person.display_name ?? 'Unnamed'
        })) ?? [])
    ];

    const hasResults = flatSuggestions.length > 0;

    useEffect(() => {
        setHighlightedIndex(-1);
    }, [debouncedQuery]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigateToSuggestion = (suggestion: FlatSuggestion) => {
        router.push(`${DESTINATION_BY_KIND[suggestion.kind]}/${suggestion.id}`);
        setIsOpen(false);
        setQuery('');
        onNavigate?.();
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (highlightedIndex >= 0 && flatSuggestions[highlightedIndex]) {
            navigateToSuggestion(flatSuggestions[highlightedIndex]);

            return;
        }

        if (trimmedQuery.length === 0) {
            return;
        }

        router.push(`/recipes?q=${encodeURIComponent(trimmedQuery)}`);
        setIsOpen(false);
        setQuery('');
        onNavigate?.();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            setIsOpen(false);

            return;
        }

        if (!hasResults) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlightedIndex((index) => (index + 1) % flatSuggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlightedIndex((index) => (index <= 0 ? flatSuggestions.length - 1 : index - 1));
        }
    };

    let flatIndex = -1;

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <form onSubmit={handleSubmit}>
                <Search
                    size={17}
                    className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled'
                />
                <input
                    type='search'
                    value={query}
                    autoFocus={autoFocus}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder='Search recipes, collections, people…'
                    aria-label='Search recipes, collections, and people'
                    className='h-10 w-full rounded-full border border-border bg-bg-secondary pl-10 pr-4 text-body text-text-primary transition-colors duration-150 placeholder:text-text-disabled focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60'
                />
            </form>

            {isOpen && isSearching && (
                <div className='absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-md border border-border bg-surface shadow-lg'>
                    {isBelowMinLength && (
                        <p className='px-4 py-3 text-caption text-text-disabled'>Keep typing — at least 2 characters.</p>
                    )}

                    {!isBelowMinLength && isLoading && <p className='px-4 py-3 text-caption text-text-disabled'>Searching…</p>}

                    {!isBelowMinLength && !isLoading && !hasResults && (
                        <p className='px-4 py-3 text-body text-text-secondary'>No matches for &quot;{trimmedQuery}&quot;.</p>
                    )}

                    {!isBelowMinLength && !isLoading && results && results.recipes.length > 0 && (
                        <SuggestionGroup label='Recipes'>
                            {results.recipes.map((recipe) => {
                                flatIndex += 1;

                                const index = flatIndex;

                                return (
                                    <SuggestionRow
                                        key={recipe.id}
                                        icon={BookOpen}
                                        label={recipe.title}
                                        isHighlighted={highlightedIndex === index}
                                        onClick={() => navigateToSuggestion({ kind: 'recipe', id: recipe.id, label: recipe.title })}
                                    />
                                );
                            })}
                        </SuggestionGroup>
                    )}

                    {!isBelowMinLength && !isLoading && results && results.collections.length > 0 && (
                        <SuggestionGroup label='Collections'>
                            {results.collections.map((collection) => {
                                flatIndex += 1;

                                const index = flatIndex;

                                return (
                                    <SuggestionRow
                                        key={collection.id}
                                        icon={Folder}
                                        label={collection.name}
                                        isHighlighted={highlightedIndex === index}
                                        onClick={() =>
                                            navigateToSuggestion({ kind: 'collection', id: collection.id, label: collection.name })
                                        }
                                    />
                                );
                            })}
                        </SuggestionGroup>
                    )}

                    {!isBelowMinLength && !isLoading && results && results.people.length > 0 && (
                        <SuggestionGroup label='People'>
                            {results.people.map((person) => {
                                flatIndex += 1;

                                const index = flatIndex;
                                const label = person.display_name ?? 'Unnamed';

                                return (
                                    <PersonSuggestionRow
                                        key={person.id}
                                        profile={person}
                                        isHighlighted={highlightedIndex === index}
                                        onClick={() => navigateToSuggestion({ kind: 'person', id: person.id, label })}
                                    />
                                );
                            })}
                        </SuggestionGroup>
                    )}
                </div>
            )}
        </div>
    );
}
