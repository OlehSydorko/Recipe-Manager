import { searchAll } from '@/api/search';
import { useCurrentProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';

const MIN_SEARCH_QUERY_LENGTH = 2;

export function useGlobalSearch(query: string) {
    const { data: currentProfile, isPending: profilePending } = useCurrentProfile();
    const trimmedQuery = query.trim();

    return useQuery({
        enabled: trimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH && !profilePending,
        queryFn: () => searchAll(trimmedQuery, currentProfile?.id),
        queryKey: ['search', trimmedQuery]
    });
}
