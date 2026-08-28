import { createClient } from '@/lib/supabaseClient';
import type { Section } from '@/types/section';

export async function getSections(recipeId: string): Promise<Section[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('sort_order', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export async function replaceSections(recipeId: string, names: string[]): Promise<Section[]> {
    const supabase = createClient();

    const { error: deleteError } = await supabase.from('sections').delete().eq('recipe_id', recipeId);

    if (deleteError) {
        throw deleteError;
    }

    if (names.length === 0) {
        return [];
    }

    const rows = names.map((name, index) => ({ name, recipe_id: recipeId, sort_order: index }));

    const { data, error } = await supabase
        .from('sections')
        .insert(rows)
        .select()
        .order('sort_order', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}
