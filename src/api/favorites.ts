import { createClient } from '@/lib/supabaseClient';


export async function getFavoriteRecipeIds(): Promise<string[]> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return [];
    }

    const { data, error } = await supabase.from('recipe_favorites').select('recipe_id').eq('user_id', user.id);

    if (error) {
        throw error;
    }

    return data.map((row) => row.recipe_id);
}

export async function isRecipeFavorited(recipeId: string): Promise<boolean> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return false;
    }

    const { data, error } = await supabase
        .from('recipe_favorites')
        .select('recipe_id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);
}

export async function addFavorite(recipeId: string): Promise<void> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase.from('recipe_favorites').insert({ user_id: user.id, recipe_id: recipeId });

    if (error) {
        throw error;
    }
}

export async function removeFavorite(recipeId: string): Promise<void> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { error } = await supabase
        .from('recipe_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

    if (error) {
        throw error;
    }
}
