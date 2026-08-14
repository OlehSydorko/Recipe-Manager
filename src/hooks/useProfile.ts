import {
    getAvatarSignedUrl,
    getCurrentProfile,
    getProfile,
    removeAvatar,
    searchProfiles,
    updateProfile,
    uploadAvatar
} from '@/api/profiles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const CURRENT_PROFILE_QUERY_KEY = ['profile', 'me'];
const MIN_SEARCH_QUERY_LENGTH = 2;

export function useCurrentProfile() {
    return useQuery({
        queryKey: CURRENT_PROFILE_QUERY_KEY,
        queryFn: getCurrentProfile
    });
}

// For rendering someone else's profile (e.g. a follower/following list entry).
export function useProfile(userId: string) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getProfile(userId),
        queryKey: ['profile', userId]
    });
}

// Name search for the Discover page. Needs the current user's id to exclude
// their own profile from results, so it depends on useCurrentProfile — stays
// disabled (and returns no results) until that's loaded, same as it stays
// disabled below the minimum query length.
export function useSearchProfiles(query: string) {
    const { data: currentProfile } = useCurrentProfile();
    const trimmedQuery = query.trim();

    return useQuery({
        enabled: trimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH && Boolean(currentProfile?.id),
        queryFn: () => searchProfiles(trimmedQuery, currentProfile?.id as string),
        queryKey: ['profiles', 'search', trimmedQuery]
    });
}

// Resolves a stored avatar path to a viewable (time-limited) signed URL.
// `path` is null/undefined while a profile has no avatar, or while it's still loading.
export function useAvatarUrl(path: string | null | undefined) {
    return useQuery({
        enabled: Boolean(path),
        queryFn: () => getAvatarSignedUrl(path as string),
        queryKey: ['avatar-url', path]
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CURRENT_PROFILE_QUERY_KEY });
        }
    });
}

type UploadAvatarInput = {
    file: File;
    previousPath?: string | null;
};

export function useUploadAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ file, previousPath }: UploadAvatarInput) => uploadAvatar(file, previousPath),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CURRENT_PROFILE_QUERY_KEY });
        }
    });
}

export function useRemoveAvatar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (path: string) => removeAvatar(path),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CURRENT_PROFILE_QUERY_KEY });
        }
    });
}
