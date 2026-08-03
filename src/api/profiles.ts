import { createClient } from '@/lib/supabaseClient';
import type { Profile } from '@/types/profile';

// avatar_url stores the object's path within this bucket, not a public URL —
// the bucket is private, so viewing an avatar requires a signed URL (see
// getAvatarSignedUrl below). Mirrors the recipe-images pattern in API/recipes.ts.
const AVATARS_BUCKET = 'avatars';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';

export async function getProfile(userId: string): Promise<Profile> {
    const supabase = createClient();

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getCurrentProfile(): Promise<Profile> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    return getProfile(user.id);
}

export type UpdateProfileInput = {
    displayName: string;
    tagline: string;
    location: string;
    bio: string;
};

export async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data, error } = await supabase
        .from('profiles')
        .update({
            display_name: input.displayName,
            tagline: input.tagline,
            location: input.location,
            bio: input.bio
        })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getAvatarSignedUrl(path: string): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase.storage
        .from(AVATARS_BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
        throw error;
    }

    return data.signedUrl;
}

// Uploads a new avatar, deleting the previous one (if any) first so replacing
// a photo never leaves an orphaned file behind. Writes the resulting path to
// profiles.avatar_url and returns the updated profile.
export async function uploadAvatar(file: File, previousPath?: string | null): Promise<Profile> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    if (previousPath) {
        await supabase.storage.from(AVATARS_BUCKET).remove([previousPath]);
    }

    const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(AVATARS_BUCKET).upload(path, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: path })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// Clears the current user's avatar: removes the storage object and sets avatar_url back to null.
export async function removeAvatar(path: string): Promise<Profile> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { error: removeError } = await supabase.storage.from(AVATARS_BUCKET).remove([path]);

    if (removeError) {
        throw removeError;
    }

    const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}
