import { getFavoriteRecipeIds, isRecipeFavorited } from '@/api/favorites';
import { getProfilesByIds } from '@/api/profiles';
import { createClient } from '@/lib/supabaseClient';
import type { Recipe, RecipeAuthor, RecipeWithAuthor, RecipeWithCategory } from '@/types/recipe';

// image_url stores the object's path within this bucket, not a public URL —
// the bucket is private, so viewing an image requires a signed URL (see
// getRecipeImageSignedUrl below).
const RECIPE_IMAGES_BUCKET = 'recipe-images';
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
const NOT_AUTHENTICATED_MESSAGE = 'Not authenticated';

// recipes.is_favorite no longer exists in the DB — it's now the
// recipe_favorites join table (see @/api/favorites), since favoriting had to
// become per-viewer once recipes became readable by any user. RecipeRow is
// what the DB actually returns; the functions below merge in `is_favorite`
// so the rest of the app can keep working against the `Recipe` shape.
type RecipeRow = Omit<Recipe, 'is_favorite'>;

// recipes RLS now allows reading any user's rows (see the
// public_recipe_read_access migration), so this filters to the current user
// explicitly to keep "my recipes" behavior for every existing caller
// (the /recipes page, profile page, home page stats) unchanged.
// getCommunityRecipes below is the new, deliberately unfiltered counterpart.
export async function getRecipes(): Promise<Recipe[]> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
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

// Backs the Community tab: every other user's recipes, with the author and
// category name attached for display. Excludes the current user's own
// recipes — those already have a home on "My Recipes", mirroring how
// searchProfiles excludes the current user from People search results.
export async function getCommunityRecipes(): Promise<RecipeWithAuthor[]> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
    }

    const [{ data, error }, favoriteIds] = await Promise.all([
        supabase
            .from('recipes')
            .select('*, categories(name)')
            .neq('user_id', user.id)
            .order('created_at', { ascending: false }),
        getFavoriteRecipeIds()
    ]);

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

// Backs the recipe grid on another user's /profile/[id] page. Same shape as
// getCommunityRecipes (recipes are public-read, see public_recipe_read_access
// migration) but scoped to one author instead of "everyone but me" — no
// author field on the result since the viewer is already on that person's
// profile page.
export async function getRecipesByUser(userId: string): Promise<RecipeWithCategory[]> {
    const supabase = createClient();

    const [{ data, error }, favoriteIds] = await Promise.all([
        supabase
            .from('recipes')
            .select('*, categories(name)')
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
        throw new Error(NOT_AUTHENTICATED_MESSAGE);
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

    // A brand-new recipe can't already be favorited by anyone.
    return { ...(data as RecipeRow), is_favorite: false };
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

    const [{ data, error }, isFavorite] = await Promise.all([
        supabase
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

// Clears a recipe's image: removes the storage object and sets image_url back to null.
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
