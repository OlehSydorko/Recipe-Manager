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

// Recipes are edited as a whole form (like title/description), so sections are saved
// the same way as ingredients/steps: replace the full list for the recipe rather than
// diffing individual rows. `names` is expected pre-filtered to non-blank, trimmed
// strings, in the order they should be saved. The returned rows are explicitly ordered
// by sort_order (not left to whatever order the insert happens to come back in), so a
// caller can zip them position-for-position with the `names` it sent to recover each
// section's real id -- ingredients/steps need that mapping to attach to the right
// section in the same save (see sectionedDrafts.ts).
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
