import { createClient } from '@/lib/supabaseClient';
import { normalizeQuantity, QUANTITY_PATTERN } from '@/lib/quantity';
import { DEFAULT_UNIT, type Ingredient, isAllowedUnit } from '@/types/ingredient';

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

export async function replaceIngredients(recipeId: string, ingredients: IngredientInput[]): Promise<Ingredient[]> {
    const supabase = createClient();

    const { error: deleteError } = await supabase.from('ingredients').delete().eq('recipe_id', recipeId);

    if (deleteError) {
        throw deleteError;
    }

    const rows = ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient, index) => {
            const quantity = normalizeQuantity(ingredient.quantity.trim());
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
