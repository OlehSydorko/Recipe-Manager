import { createClient } from '@/lib/supabaseClient';
import type { Recipe } from '@/types/recipe';

// image_url stores the object's path within this bucket, not a public URL —
// the bucket is private, so viewing an image requires a signed URL (see
// getRecipeImageSignedUrl below).
const RECIPE_IMAGES_BUCKET = 'recipe-images';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

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
    instructions: string;
    categoryId: string;
    portions: number;
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
            instructions: input.instructions,
            category_id: input.categoryId,
            portions: input.portions,
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
    instructions: string;
    categoryId: string;
    portions: number;
};

export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('recipes')
        .update({
            title: input.title,
            description: input.description,
            instructions: input.instructions,
            category_id: input.categoryId,
            portions: input.portions,
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

export async function setRecipeFavorite(id: string, isFavorite: boolean): Promise<Recipe> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('recipes')
        .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function deleteRecipe(id: string, imagePath?: string | null): Promise<void> {
    const supabase = createClient();

    if (imagePath) {
        // Best-effort: a storage hiccup here shouldn't block deleting the recipe row.
        // Worst case is a rare orphaned file, which is an acceptable trade-off.
        await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([imagePath]);
    }

    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) {
        throw error;
    }
}

export async function getRecipeImageSignedUrl(path: string): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase.storage
        .from(RECIPE_IMAGES_BUCKET)
        .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
        throw error;
    }

    return data.signedUrl;
}

// Uploads a new image for a recipe, deleting the previous one (if any) first
// so replacing a photo never leaves an orphaned file behind. Writes the
// resulting path to recipes.image_url and returns the updated recipe.
export async function uploadRecipeImage(recipeId: string, file: File, previousPath?: string | null): Promise<Recipe> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    if (previousPath) {
        await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([previousPath]);
    }

    const path = `${user.id}/${recipeId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).upload(path, file);

    if (uploadError) {
        throw uploadError;
    }

    const { data, error } = await supabase
        .from('recipes')
        .update({ image_url: path, updated_at: new Date().toISOString() })
        .eq('id', recipeId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

// Clears a recipe's image: removes the storage object and sets image_url back to null.
export async function removeRecipeImage(recipeId: string, path: string): Promise<Recipe> {
    const supabase = createClient();

    const { error: removeError } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([path]);

    if (removeError) {
        throw removeError;
    }

    const { data, error } = await supabase
        .from('recipes')
        .update({ image_url: null, updated_at: new Date().toISOString() })
        .eq('id', recipeId)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}
