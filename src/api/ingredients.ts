import { createClient } from '@/lib/supabaseClient';
import { DEFAULT_UNIT, type Ingredient, isAllowedUnit } from '@/types/ingredient';

// Matches what the Qty input allows client-side: digits with at most one
// decimal point and at most one fraction slash (e.g. "1", "1.5", "1/2").
// Groups are sequential (not nested), so there's no catastrophic-backtracking risk here.
// Exported so src/lib/quantity.ts can parse the same format when scaling for portions.
// eslint-disable-next-line security/detect-unsafe-regex
export const QUANTITY_PATTERN = /^\d*(?:\.\d*)?(?:\/\d*)?$/;

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
    sectionId: string | null;
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
        .map((ingredient, index) => {
            const quantity = ingredient.quantity.trim();
            const unit = ingredient.unit.trim();

            return {
                name: ingredient.name.trim(),
                quantity: QUANTITY_PATTERN.test(quantity) ? quantity : '',
                recipe_id: recipeId,
                section_id: ingredient.sectionId,
                sort_order: index,
                unit: isAllowedUnit(unit) ? unit : DEFAULT_UNIT
            };
        });

    if (rows.length === 0) {
        return [];
    }

    const { data, error } = await supabase.from('ingredients').insert(rows).select();

    if (error) {
        throw error;
    }

    return data;
}
