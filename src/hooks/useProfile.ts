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

export function useProfile(userId: string) {
    return useQuery({
        enabled: Boolean(userId),
        queryFn: () => getProfile(userId),
        queryKey: ['profile', userId]
    });
}

export function useSearchProfiles(query: string) {
    const { data: currentProfile, isPending: profilePending } = useCurrentProfile();
    const trimmedQuery = query.trim();

    return useQuery({
        enabled: trimmedQuery.length >= MIN_SEARCH_QUERY_LENGTH && !profilePending,
        queryFn: () => searchProfiles(trimmedQuery, currentProfile?.id),
        queryKey: ['profiles', 'search', trimmedQuery]
    });
}

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
