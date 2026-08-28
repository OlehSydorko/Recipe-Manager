import { getFavoriteRecipeIds, isRecipeFavorited } from '@/api/favorites';
import { getProfilesByIds } from '@/api/profiles';
import { createClient } from '@/lib/supabaseClient';
import type { Recipe, RecipeAuthor, RecipeWithAuthor, RecipeWithCategory } from '@/types/recipe';

const RECIPE_IMAGES_BUCKET = 'recipe-images';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';
const RECIPE_WITH_CATEGORY_SELECT = '*, categories(name)';

type RecipeRow = Omit<Recipe, 'is_favorite'>;

export async function getRecipes(): Promise<Recipe[]> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return [];
    }

    const [{ data, error }, favoriteIds] = await Promise.all([
        supabase.from('recipes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        getFavoriteRecipeIds()
    ]);

    if (error) {
        throw error;
    }

    const favoriteRecipeIds = new Set(favoriteIds);

    return (data as RecipeRow[]).map((recipe) => ({
        ...recipe,
        is_favorite: favoriteRecipeIds.has(recipe.id)
    }));
}

type CommunityRecipeRow = RecipeRow & { categories: { name: string } | null };

export async function getCommunityRecipes(): Promise<RecipeWithAuthor[]> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    let query = supabase.from('recipes').select(RECIPE_WITH_CATEGORY_SELECT).order('created_at', { ascending: false });

    if (user) {
        query = query.neq('user_id', user.id);
    }

    const [{ data, error }, favoriteIds] = await Promise.all([query, getFavoriteRecipeIds()]);

    if (error) {
        throw error;
    }

    const rows = data as unknown as CommunityRecipeRow[];
    const favoriteRecipeIds = new Set(favoriteIds);
    const authorIds = [...new Set(rows.map((row) => row.user_id))];
    const authorProfiles = await getProfilesByIds(authorIds);

    const authorsById = new Map<string, RecipeAuthor>(
        authorProfiles.map((profile) => [
            profile.id,
            { id: profile.id, displayName: profile.display_name, avatarUrl: profile.avatar_url }
        ])
    );

    return rows.map(({ categories, ...recipe }) => ({
        ...recipe,
        is_favorite: favoriteRecipeIds.has(recipe.id),
        categoryName: categories?.name ?? null,
        author: authorsById.get(recipe.user_id) ?? { id: recipe.user_id, displayName: null, avatarUrl: null }
    }));
}

export async function getRecipesByUser(userId: string): Promise<RecipeWithCategory[]> {
    const supabase = createClient();

    const [{ data, error }, favoriteIds] = await Promise.all([
        supabase
            .from('recipes')
            .select(RECIPE_WITH_CATEGORY_SELECT)
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
        getFavoriteRecipeIds()
    ]);

    if (error) {
        throw error;
    }

    const rows = data as unknown as CommunityRecipeRow[];
    const favoriteRecipeIds = new Set(favoriteIds);

    return rows.map(({ categories, ...recipe }) => ({
        ...recipe,
        is_favorite: favoriteRecipeIds.has(recipe.id),
        categoryName: categories?.name ?? null
    }));
}

export async function getRecipesByIds(ids: string[]): Promise<RecipeWithCategory[]> {
    if (ids.length === 0) {
        return [];
    }

    const supabase = createClient();

    const [{ data, error }, favoriteIds] = await Promise.all([
        supabase.from('recipes').select(RECIPE_WITH_CATEGORY_SELECT).in('id', ids),
        getFavoriteRecipeIds()
    ]);

    if (error) {
        throw error;
    }

    const rows = data as unknown as CommunityRecipeRow[];
    const favoriteRecipeIds = new Set(favoriteIds);

    return rows.map(({ categories, ...recipe }) => ({
        ...recipe,
        is_favorite: favoriteRecipeIds.has(recipe.id),
        categoryName: categories?.name ?? null
    }));
}

export async function getRecipe(id: string): Promise<Recipe> {
    const supabase = createClient();

    const [{ data, error }, isFavorite] = await Promise.all([
        supabase.from('recipes').select('*').eq('id', id).single(),
        isRecipeFavorited(id)
    ]);

    if (error) {
        throw error;
    }

    return { ...(data as RecipeRow), is_favorite: isFavorite };
}

export type CreateRecipeInput = {
    title: string;
    description: string;
    categoryId: string;
    portions: number;
};

export async function createRecipe(input: CreateRecipeInput): Promise<Recipe> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const { data, error } = await supabase
        .from('recipes')
        .insert({
            title: input.title,
            description: input.description,
            category_id: input.categoryId,
            portions: input.portions,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        throw error;
    }

    return { ...(data as RecipeRow), is_favorite: false };
}

export type UpdateRecipeInput = {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    portions: number;
};

export async function updateRecipe(input: UpdateRecipeInput): Promise<Recipe> {
    const supabase = createClient();

    const [{ data, error }, isFavorite] = await Promise.all([
        supabase
            .from('recipes')
            .update({
                title: input.title,
                description: input.description,
                category_id: input.categoryId,
                portions: input.portions,
                updated_at: new Date().toISOString()
            })
            .eq('id', input.id)
            .select()
            .single(),
        isRecipeFavorited(input.id)
    ]);

    if (error) {
        throw error;
    }

    return { ...(data as RecipeRow), is_favorite: isFavorite };
}

export async function deleteRecipe(id: string, imagePath?: string | null): Promise<void> {
    const supabase = createClient();

    if (imagePath) {
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

export async function uploadRecipeImage(recipeId: string, file: File, previousPath?: string | null): Promise<Recipe> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    if (previousPath) {
        await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([previousPath]);
    }

    const path = `${user.id}/${recipeId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).upload(path, file);

    if (uploadError) {
        throw uploadError;
    }

    const [{ data, error }, isFavorite] = await Promise.all([
        supabase
            .from('recipes')
            .update({ image_url: path, updated_at: new Date().toISOString() })
            .eq('id', recipeId)
            .select()
            .single(),
        isRecipeFavorited(recipeId)
    ]);

    if (error) {
        throw error;
    }

    return { ...(data as RecipeRow), is_favorite: isFavorite };
}

export async function removeRecipeImage(recipeId: string, path: string): Promise<Recipe> {
    const supabase = createClient();

    const { error: removeError } = await supabase.storage.from(RECIPE_IMAGES_BUCKET).remove([path]);

    if (removeError) {
        throw removeError;
    }

    const [{ data, error }, isFavorite] = await Promise.all([
        supabase
            .from('recipes')
            .update({ image_url: null, updated_at: new Date().toISOString() })
            .eq('id', recipeId)
            .select()
            .single(),
        isRecipeFavorited(recipeId)
    ]);

    if (error) {
        throw error;
    }

    return { ...(data as RecipeRow), is_favorite: isFavorite };
}
