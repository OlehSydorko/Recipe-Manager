import {
    isFollowing as fetchIsFollowing,
    followUser,
    getFollowCounts,
    getFollowers,
    getFollowing,
    unfollowUser
} from '@/api/follows';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const FOLLOW_COUNTS_KEY = 'follow-counts';
const IS_FOLLOWING_KEY = 'is-following';
const FOLLOWERS_KEY = 'followers';
const FOLLOWING_KEY = 'following';

export function useFollowCounts(userId: string | null) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getFollowCounts(userId as string),
        queryKey: [FOLLOW_COUNTS_KEY, userId]
    });
}

export function useIsFollowing(userId: string | null) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => fetchIsFollowing(userId as string),
        queryKey: [IS_FOLLOWING_KEY, userId]
    });
}

export function useFollowers(userId: string | null) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getFollowers(userId as string),
        queryKey: [FOLLOWERS_KEY, userId]
    });
}

export function useFollowing(userId: string | null) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getFollowing(userId as string),
        queryKey: [FOLLOWING_KEY, userId]
    });
}

// Optimistic on the is-following flag only — same "high-frequency, low-risk
// toggle" reasoning as useSetRecipeFavorite. Counts/lists are broadly
// invalidated on settle rather than patched in place, since a single follow
// action affects two different users' stats (the follower's "following"
// count and the followed user's "followers" count) and only one of those
// user ids is known here.
export function useFollowUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => followUser(userId),
        onMutate: async (userId: string) => {
            await queryClient.cancelQueries({ queryKey: [IS_FOLLOWING_KEY, userId] });

            const previous = queryClient.getQueryData<boolean>([IS_FOLLOWING_KEY, userId]);

            queryClient.setQueryData([IS_FOLLOWING_KEY, userId], true);

            return { previous };
        },
        onError: (_error, userId, context) => {
            queryClient.setQueryData([IS_FOLLOWING_KEY, userId], context?.previous ?? false);
        },
        onSettled: (_data, _error, userId) => {
            queryClient.invalidateQueries({ queryKey: [IS_FOLLOWING_KEY, userId] });
            queryClient.invalidateQueries({ queryKey: [FOLLOW_COUNTS_KEY] });
            queryClient.invalidateQueries({ queryKey: [FOLLOWERS_KEY] });
            queryClient.invalidateQueries({ queryKey: [FOLLOWING_KEY] });
        }
    });
}

export function useUnfollowUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => unfollowUser(userId),
        onMutate: async (userId: string) => {
            await queryClient.cancelQueries({ queryKey: [IS_FOLLOWING_KEY, userId] });

            const previous = queryClient.getQueryData<boolean>([IS_FOLLOWING_KEY, userId]);

            queryClient.setQueryData([IS_FOLLOWING_KEY, userId], false);

            return { previous };
        },
        onError: (_error, userId, context) => {
            queryClient.setQueryData([IS_FOLLOWING_KEY, userId], context?.previous ?? true);
        },
        onSettled: (_data, _error, userId) => {
            queryClient.invalidateQueries({ queryKey: [IS_FOLLOWING_KEY, userId] });
            queryClient.invalidateQueries({ queryKey: [FOLLOW_COUNTS_KEY] });
            queryClient.invalidateQueries({ queryKey: [FOLLOWERS_KEY] });
            queryClient.invalidateQueries({ queryKey: [FOLLOWING_KEY] });
        }
    });
}
