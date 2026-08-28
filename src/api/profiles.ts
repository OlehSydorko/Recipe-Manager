import { createClient } from '@/lib/supabaseClient';
import type { Profile } from '@/types/profile';

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

export async function getProfilesByIds(userIds: string[]): Promise<Profile[]> {
    if (userIds.length === 0) {
        return [];
    }

    const supabase = createClient();

    const { data, error } = await supabase.from('profiles').select('*').in('id', userIds);

    if (error) {
        throw error;
    }

    return data;
}

export async function getCurrentProfile(): Promise<Profile | null> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return null;
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
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

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

const SEARCH_RESULTS_LIMIT = 20;

export async function searchProfiles(query: string, excludeUserId?: string): Promise<Profile[]> {
    const supabase = createClient();

    let request = supabase.from('profiles').select('*').ilike('display_name', `%${query}%`);

    if (excludeUserId) {
        request = request.neq('id', excludeUserId);
    }

    const { data, error } = await request.limit(SEARCH_RESULTS_LIMIT);

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

export async function uploadAvatar(file: File, previousPath?: string | null): Promise<Profile> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

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

export async function removeAvatar(path: string): Promise<Profile> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

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
