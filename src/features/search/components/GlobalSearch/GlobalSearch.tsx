'use client';

import { useEffect, useRef, useState } from 'react';
import { useAvatarUrl } from '@/hooks/useProfile';
import { useGlobalSearch } from '@/hooks/useSearch';
import type { Profile } from '@/types/profile';
import { BookOpen, Folder, Search, User, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './GlobalSearch.module.scss';

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

const LIST_PAGE_BY_KIND: Record<SuggestionKind, string> = {
    recipe: '/recipes',
    collection: '/collections',
    person: '/people'
};

function isExactNameMatch(suggestion: FlatSuggestion, searchTerm: string): boolean {
    return suggestion.label.trim().toLowerCase() === searchTerm.trim().toLowerCase();
}

function useDebouncedValue(value: string, delayMs: number): [string, () => void] {
    const [debounced, setDebounced] = useState(value);
    const latestValueRef = useRef(value);

    latestValueRef.current = value;

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebounced(value), delayMs);

        return () => clearTimeout(timeoutId);
    }, [value, delayMs]);

    const flush = () => setDebounced(latestValueRef.current);

    return [debounced, flush];
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
            className={`${styles.suggestionRow} ${isHighlighted ? styles.highlighted : ''}`}
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

function PersonSuggestionRow({ profile, isHighlighted, onClick }: PersonSuggestionRowProps) {
    const { data: avatarUrl } = useAvatarUrl(profile.avatar_url);

    return (
        <button
            type='button'
            onClick={onClick}
            className={`${styles.suggestionRow} ${isHighlighted ? styles.highlighted : ''}`}
        >
            <span className={styles.avatarFallback}>
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
        <div className={styles.suggestionGroup}>
            <p className={styles.groupLabel}>{label}</p>
            {children}
        </div>
    );
}

type GlobalSearchProps = {
    className?: string;
    autoFocus?: boolean;
    onNavigate?: () => void;
};

export function GlobalSearch({ className, autoFocus = false, onNavigate }: GlobalSearchProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [hasExplicitHighlight, setHasExplicitHighlight] = useState(false);
    const [pendingSubmitQuery, setPendingSubmitQuery] = useState<string | null>(null);
    const [debouncedQuery, flushDebouncedQuery] = useDebouncedValue(query, DEBOUNCE_MS);
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
        setHighlightedIndex(hasResults ? 0 : -1);
        setHasExplicitHighlight(false);
    }, [debouncedQuery, hasResults]);

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

    const goToListPage = (kind: SuggestionKind, searchTerm: string) => {
        router.push(`${LIST_PAGE_BY_KIND[kind]}?q=${encodeURIComponent(searchTerm)}`);
        setIsOpen(false);
        setQuery('');
        onNavigate?.();
    };

    const resolveSubmit = () => {
        const effectiveIndex = !isSearching ? -1 : hasExplicitHighlight ? highlightedIndex : hasResults ? 0 : -1;
        const topSuggestion = effectiveIndex >= 0 ? flatSuggestions[effectiveIndex] : undefined;

        if (topSuggestion) {
            const isUnambiguousPersonMatch = topSuggestion.kind === 'person' && isExactNameMatch(topSuggestion, trimmedQuery);

            if (hasExplicitHighlight || isUnambiguousPersonMatch) {
                navigateToSuggestion(topSuggestion);
            } else {
                goToListPage(topSuggestion.kind, trimmedQuery);
            }

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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const resultsMatchWhatsTyped = trimmedQuery === debouncedQuery.trim() && !isPending && !isFetching;

        if (isSearching && !resultsMatchWhatsTyped) {
            flushDebouncedQuery();
            setPendingSubmitQuery(trimmedQuery);

            return;
        }

        resolveSubmit();
    };

    useEffect(() => {
        if (pendingSubmitQuery === null) {
            return;
        }

        if (debouncedQuery.trim() !== pendingSubmitQuery || isPending || isFetching) {
            return;
        }

        setPendingSubmitQuery(null);
        resolveSubmit();
    }, [pendingSubmitQuery, debouncedQuery, isPending, isFetching]);

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
            setHasExplicitHighlight(true);
            setHighlightedIndex((index) => (index + 1) % flatSuggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHasExplicitHighlight(true);
            setHighlightedIndex((index) => (index <= 0 ? flatSuggestions.length - 1 : index - 1));
        }
    };

    let flatIndex = -1;

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <form onSubmit={handleSubmit}>
                <Search size={17} className={styles.searchIcon} />
                <input
                    type='search'
                    value={query}
                    autoFocus={autoFocus}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setPendingSubmitQuery(null);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder='Search recipes, collections, people…'
                    aria-label='Search recipes, collections, and people'
                    className={styles.searchInput}
                />
            </form>

            {isOpen && isSearching && (
                <div className={styles.resultsPanel}>
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
