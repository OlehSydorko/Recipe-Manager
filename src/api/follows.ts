import { createClient } from '@/lib/supabaseClient';
import type { FollowCounts } from '@/types/follow';
import type { Profile } from '@/types/profile';

export async function getFollowCounts(userId: string): Promise<FollowCounts> {
    const supabase = createClient();

    const [followersResult, followingResult] = await Promise.all([
        supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', userId),
        supabase.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', userId)
    ]);

    if (followersResult.error) {
        throw followersResult.error;
    }

    if (followingResult.error) {
        throw followingResult.error;
    }

    return { followers: followersResult.count ?? 0, following: followingResult.count ?? 0 };
}

export async function isFollowing(targetUserId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return false;
    }

    const { data, error } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);
}

export async function followUser(targetUserId: string): Promise<void> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase.from('follows').insert({ follower_id: user.id, followed_id: targetUserId });

    if (error) {
        throw error;
    }
}

export async function unfollowUser(targetUserId: string): Promise<void> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId);

    if (error) {
        throw error;
    }
}

export async function getFollowers(userId: string): Promise<Profile[]> {
    const supabase = createClient();

    const { data: rows, error } = await supabase.from('follows').select('follower_id').eq('followed_id', userId);

    if (error) {
        throw error;
    }

    const ids = rows.map((row) => row.follower_id);

    if (ids.length === 0) {
        return [];
    }

    const { data, error: profilesError } = await supabase.from('profiles').select('*').in('id', ids);

    if (profilesError) {
        throw profilesError;
    }

    return data;
}

export async function getFollowing(userId: string): Promise<Profile[]> {
    const supabase = createClient();

    const { data: rows, error } = await supabase.from('follows').select('followed_id').eq('follower_id', userId);

    if (error) {
        throw error;
    }

    const ids = rows.map((row) => row.followed_id);

    if (ids.length === 0) {
        return [];
    }

    const { data, error: profilesError } = await supabase.from('profiles').select('*').in('id', ids);

    if (profilesError) {
        throw profilesError;
    }

    return data;
}
