import {
    getAvatarSignedUrl,
    getCurrentProfile,
    getProfile,
    removeAvatar,
    updateProfile,
    uploadAvatar
} from '@/API/profiles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const CURRENT_PROFILE_QUERY_KEY = ['profile', 'me'];

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
