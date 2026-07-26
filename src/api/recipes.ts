import { createClient } from '@/lib/supabaseClient';
import type { Recipe } from '@/types/recipe';

export async function getRecipes(): Promise<Recipe[]> {
    const supabase = createClient();

    const { data, error } = await supabase.from('recipes').select('*').order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return data;
}

export async function getRecipe(id: string): Promise<Recipe> {
    const supabase = createClient();

    const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();

    if (error) {
        throw error;
    }

    return data;
}

export type CreateRecipeInput = {
    title: string;
    description: string;
    categoryId: string;
};

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
        .from('recipes')
        .insert({
            title: input.title,
            description: input.description,
            category_id: input.categoryId,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export type UpdateRecipeInput = {
    id: string;
    title: string;
    description: string;
    categoryId: string;
};

export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('recipes')
        .update({
            title: input.title,
            description: input.description,
            category_id: input.categoryId,
            updated_at: new Date().toISOString()
        })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteRecipe(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) {
        throw error;
    }
}
