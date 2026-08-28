import { createClient } from '@/lib/supabaseClient';
import type { Step } from '@/types/step';

export async function getSteps(recipeId: string): Promise<Step[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('steps')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('sort_order', { ascending: true });

    if (error) {
        throw error;
    }

    return data;
}

export type StepInput = {
    instruction: string;
    sectionId: string | null;
};

export async function replaceSteps(recipeId: string, steps: StepInput[]): Promise<Step[]> {
    const supabase = createClient();

    const { error: deleteError } = await supabase.from('steps').delete().eq('recipe_id', recipeId);

    if (deleteError) {
        throw deleteError;
    }

    const rows = steps
        .filter((step) => step.instruction.trim())
        .map((step, index) => ({
            instruction: step.instruction.trim(),
            recipe_id: recipeId,
            section_id: step.sectionId,
            sort_order: index
        }));

    if (rows.length === 0) {
        return [];
    }

    const { data, error } = await supabase.from('steps').insert(rows).select();

    if (error) {
        throw error;
    }

    return data;
}
