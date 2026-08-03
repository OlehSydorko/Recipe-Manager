import { createClient } from '@/lib/supabaseClient';
import type { CollectionWithCount } from '@/types/collection';

// Supabase returns the embedded aggregate as collection_recipes: [{ count: N }].
type CollectionRow = CollectionWithCount & {
    collection_recipes: { count: number }[];
};

export async function getCollections(): Promise<CollectionWithCount[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collections')
        .select('*, collection_recipes(count)')
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return (data as CollectionRow[]).map(({ collection_recipes: counts, ...collection }) => ({
        ...collection,
        recipeCount: counts?.[0]?.count ?? 0
    }));
}

export async function getCollectionRecipeIds(collectionId: string): Promise<string[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collection_recipes')
        .select('recipe_id')
        .eq('collection_id', collectionId);

    if (error) {
        throw error;
    }

    return data.map((row) => row.recipe_id);
}

// Replaces a collection's full recipe membership, mirroring how ingredients
// are saved for a recipe: delete the existing rows, then insert the current
// set, rather than diffing individual rows.
async function replaceCollectionRecipes(collectionId: string, recipeIds: string[]): Promise<void> {
    const supabase = createClient();

    const { error: deleteError } = await supabase.from('collection_recipes').delete().eq('collection_id', collectionId);

    if (deleteError) {
        throw deleteError;
    }

    if (recipeIds.length === 0) {
        return;
    }

    const rows = recipeIds.map((recipeId, index) => ({
        collection_id: collectionId,
        recipe_id: recipeId,
        sort_order: index
    }));

    const { error: insertError } = await supabase.from('collection_recipes').insert(rows);

    if (insertError) {
        throw insertError;
    }
}

export type CreateCollectionInput = {
    name: string;
    description: string;
    recipeIds: string[];
};

export async function createCollection(input: CreateCollectionInput): Promise<CollectionWithCount> {
    const supabase = createClient();

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
        .from('collections')
        .insert({ name: input.name, description: input.description, user_id: user.id })
        .select()
        .single();

    if (error) {
        throw error;
    }

    if (input.recipeIds.length > 0) {
        await replaceCollectionRecipes(data.id, input.recipeIds);
    }

    return { ...data, recipeCount: input.recipeIds.length };
}

export type UpdateCollectionInput = {
    id: string;
    name: string;
    description: string;
    recipeIds: string[];
};

export async function updateCollection(input: UpdateCollectionInput): Promise<CollectionWithCount> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collections')
        .update({ name: input.name, description: input.description })
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        throw error;
    }

    await replaceCollectionRecipes(input.id, input.recipeIds);

    return { ...data, recipeCount: input.recipeIds.length };
}

export async function deleteCollection(id: string): Promise<void> {
    const supabase = createClient();

    // collection_recipes rows cascade-delete via the FK, no separate cleanup needed.
    const { error } = await supabase.from('collections').delete().eq('id', id);

    if (error) {
        throw error;
    }
}
