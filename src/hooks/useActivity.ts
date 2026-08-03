import { getActivity } from '@/API/activity';
import { useQuery } from '@tanstack/react-query';

export function useActivity(userId: string | null) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getActivity(userId as string),
        queryKey: ['activity', userId]
    });
}
