import { searchAll } from '@/api/search';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';

const MIN_SEARCH_QUERY_LENGTH = 2;

// Backs the global nav search dropdown. Waits on useCurrentProfile only to
// know whether to exclude the viewer's own profile from the People results
// (logged-in) or not (guest, where currentProfile resolves to null) -- same
// pattern as useSearchProfiles, and must not stay disabled for a null
// profile since guest search is a valid, common state here.
export function useGlobalSearch(query: string) {
    const { data: currentProfile, isPending: profilePending } = useCurrentProfile();
    const trimmedQuery = query.trim();

    return useQuery({
        enabled: trimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH && !profilePending,
        queryFn: () => searchAll(trimmedQuery, currentProfile?.id),
        queryKey: ['search', trimmedQuery]
    });
}
