import { createClient } from '@/lib/supabaseClient';
import type { Ingredient } from '@/types/ingredient';

export async function getIngredients(recipeId: string): Promise<Ingredient[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('sort_order', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export type IngredientInput = {
    name: string;
    quantity: string;
    unit: string;
};

// Recipes are edited as a whole form (like title/description), so ingredients are
// saved the same way: replace the full list for the recipe rather than diffing
// individual rows against the database.
export async function replaceIngredients(recipeId: string, ingredients: IngredientInput[]): Promise<Ingredient[]> {
    const supabase = createClient();

    const { error: deleteError } = await supabase.from('ingredients').delete().eq('recipe_id', recipeId);

    if (deleteError) {
        throw deleteError;
    }

    const rows = ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient, index) => ({
            name: ingredient.name.trim(),
            quantity: ingredient.quantity.trim(),
            recipe_id: recipeId,
            sort_order: index,
            unit: ingredient.unit.trim()
        }));

    if (rows.length === 0) {
        return [];
    }

    const { data, error } = await supabase.from('ingredients').insert(rows).select();

    if (error) {
        throw error;
    }

    return data;
}
