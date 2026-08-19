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

// Recipes, collections, and people each have their own browsable, filterable
// list page (RecipesPage / CollectionsSection / FindPeopleSearch, all read
// ?q= on mount). Plain Enter -- i.e. the user typed and submitted without
// arrowing to a specific suggestion -- sends them to that list instead of
// guessing which exact one they meant, UNLESS the query is an exact,
// unambiguous name match for a person -- see isExactNameMatch and
// handleSubmit.
const LIST_PAGE_BY_KIND: Record<SuggestionKind, string> = {
    recipe: '/recipes',
    collection: '/collections',
    person: '/people'
};

// A fully-typed, exact name match is unambiguous enough to skip the "here's
// everyone matching" list and jump straight to that one profile -- unlike a
// partial match, or a recipe/collection match, which always goes to the list
// page (see LIST_PAGE_BY_KIND) so the user can pick the right one.
function isExactNameMatch(suggestion: FlatSuggestion, searchTerm: string): boolean {
    return suggestion.label.trim().toLowerCase() === searchTerm.trim().toLowerCase();
}

// Debounces the raw input so useGlobalSearch (and the query it fires) only
// runs once typing pauses, not on every keystroke -- same pattern as
// FindPeopleSearch's local debounce hook. Also returns a flush function so a
// caller (handleSubmit below) can force the debounced value to catch up to
// the live one immediately, instead of waiting out the rest of delayMs.
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
// collections, and people as the user types. Clicking a row (or arrowing to
// one and pressing Enter) always jumps straight to that specific item.
// Plain Enter -- no explicit arrow selection -- instead defers to the
// top-ranked suggestion: an exact, full name match on a person jumps
// straight to that profile, and everything else (a partial person match, or
// any recipe/collection match) sends the user to that kind's filtered list
// page instead of guessing which exact one they meant.
export function GlobalSearch({ className, autoFocus = false, onNavigate }: GlobalSearchProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    // Tracks whether the current highlight came from an explicit ArrowUp/
    // ArrowDown press, as opposed to the automatic top-suggestion default
    // below -- handleSubmit uses this to tell "user picked this one" apart
    // from "this just happens to be first".
    const [hasExplicitHighlight, setHasExplicitHighlight] = useState(false);
    // Set by handleSubmit when Enter is pressed before the debounced query
    // (and its results) have caught up with what's actually typed -- see the
    // "flush on submit" effect below for how this gets resolved.
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

    // Defaults the highlight to the top suggestion whenever a search settles
    // with results, purely so the top row reads as highlighted and Enter has
    // something to act on -- handleSubmit decides what "acting on it" means
    // based on hasExplicitHighlight and the suggestion's kind. Also clears
    // hasExplicitHighlight, since a fresh result set invalidates any earlier
    // arrow-key selection.
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

    // The actual "where does Enter go" decision, shared by the synchronous
    // path (results already match what's typed) and the deferred path below
    // (results just caught up after a flush). Deliberately reads
    // hasResults/flatSuggestions fresh rather than the highlightedIndex
    // state for the *implicit* case, since that state can lag a render
    // behind a just-arrived result set -- explicit arrow selections don't
    // have that lag, so those still use the real highlightedIndex.
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
            // The suggestions on screen right now describe an older (often
            // shorter, or still-loading) query, not what's actually typed --
            // e.g. Enter pressed right after the last keystroke, before the
            // debounce fired, or while that query's fetch is still in
            // flight. Force the real query through immediately and let the
            // effect below finish once its results are actually in, rather
            // than guessing off stale (often empty) suggestions.
            flushDebouncedQuery();
            setPendingSubmitQuery(trimmedQuery);

            return;
        }

        resolveSubmit();
    };

    // Finishes a submit that had to wait on the flush above: once the
    // debounced query catches up to the one we flushed for, and that
    // query's fetch has settled, resolveSubmit sees accurate results.
    useEffect(() => {
        if (pendingSubmitQuery === null) {
            return;
        }

        if (debouncedQuery.trim() !== pendingSubmitQuery || isPending || isFetching) {
            return;
        }

        setPendingSubmitQuery(null);
        resolveSubmit();
        // resolveSubmit intentionally left out of the dependency array -- it
        // closes over state that changes every render, and depending on it
        // would fire this effect more than once for the same flush.
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
                <Search
                    size={17}
                    className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-disabled'
                />
                <input
                    type='search'
                    value={query}
                    autoFocus={autoFocus}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        // Further typing supersedes any submit that was
                        // waiting on a flushed query -- that intent no
                        // longer matches what's on screen.
                        setPendingSubmitQuery(null);
                    }}
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
