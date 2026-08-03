import { createClient } from '@/lib/supabaseClient';
import type { ActivityItem } from '@/types/activity';

const ACTIVITY_LIMIT = 30;

// recipe_id embeds cleanly via PostgREST (activity_log.recipe_id -> recipes.id
// is a direct FK within public). target_user_id references auth.users, not
// public.profiles, so display names are resolved with a separate lookup,
// same as the two-step pattern in API/follows.ts.
export async function getActivity(userId: string): Promise<ActivityItem[]> {
    const supabase = createClient();

    const { data: rows, error } = await supabase
        .from('activity_log')
        .select('id, type, created_at, recipe_id, target_user_id, recipe:recipes(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(ACTIVITY_LIMIT);

    if (error) {
        throw error;
    }

    const targetUserIds = Array.from(
        new Set(rows.map((row) => row.target_user_id).filter((id): id is string => Boolean(id)))
    );

    let targetNamesById = new Map<string, string | null>();

    if (targetUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', targetUserIds);

        if (profilesError) {
            throw profilesError;
        }

        targetNamesById = new Map(profiles.map((profile) => [profile.id, profile.display_name]));
    }

    return rows.map((row) => ({
        created_at: row.created_at,
        id: row.id,
        recipeId: row.recipe_id,
        recipeTitle: (row.recipe as unknown as { title: string } | null)?.title ?? null,
        targetDisplayName: row.target_user_id ? (targetNamesById.get(row.target_user_id) ?? null) : null,
        targetUserId: row.target_user_id,
        type: row.type
    }));
}
