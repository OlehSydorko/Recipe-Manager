import type { createClient } from '@/lib/supabaseServerClient';

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export const DAILY_IMPORT_LIMIT = 20;

export type ImportMode = 'image';

export async function checkAndRecordImport(
    supabase: ServerSupabaseClient,
    userId: string,
    mode: ImportMode
): Promise<boolean> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
        .from('recipe_import_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', since);

    if (countError) {
        throw countError;
    }

    if ((count ?? 0) >= DAILY_IMPORT_LIMIT) {
        return false;
    }

    const { error: insertError } = await supabase.from('recipe_import_log').insert({ mode, user_id: userId });

    if (insertError) {
        throw insertError;
    }

    return true;
}
