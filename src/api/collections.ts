import { createClient } from '@/lib/supabaseClient';
import type { CollectionWithCount } from '@/types/collection';

type CollectionRow = CollectionWithCount & {
    collection_recipes: { count: number }[];
};

const COLLECTION_WITH_RECIPE_COUNT_SELECT = '*, collection_recipes(count)';

export async function getCollections(): Promise<CollectionWithCount[]> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        return [];
    }

    const [{ data, error }, coverPathsByCollection] = await Promise.all([
        supabase
            .from('collections')
            .select(COLLECTION_WITH_RECIPE_COUNT_SELECT)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
        getCollectionCoverPaths()
    ]);

    if (error) {
        throw error;
    }

    return (data as CollectionRow[]).map(({ collection_recipes: counts, ...collection }) => ({
        ...collection,
        recipeCount: counts?.[0]?.count ?? 0,
        coverImagePaths: coverPathsByCollection.get(collection.id) ?? []
    }));
}

export async function getCollection(id: string): Promise<CollectionWithCount | null> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_WITH_RECIPE_COUNT_SELECT)
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    const { collection_recipes: counts, ...collection } = data as CollectionRow;
    const coverImagePaths = await getCollectionCoverPathsForCollection(id);

    return { ...collection, recipeCount: counts?.[0]?.count ?? 0, coverImagePaths };
}

export async function getPublicCollectionsByUser(userId: string): Promise<CollectionWithCount[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_WITH_RECIPE_COUNT_SELECT)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

    if (error) {
        throw error;
    }

    return Promise.all(
        (data as CollectionRow[]).map(async ({ collection_recipes: counts, ...collection }) => ({
            ...collection,
            recipeCount: counts?.[0]?.count ?? 0,
            coverImagePaths: await getCollectionCoverPathsForCollection(collection.id)
        }))
    );
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

type CollectionCoverRow = {
    collection_id: string;
    recipe: { image_url: string | null } | null;
};

export async function getCollectionCoverPaths(): Promise<Map<string, string[]>> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collection_recipes')
        .select('collection_id, recipe:recipes(image_url)')
        .order('sort_order', { ascending: true });

        if (error) {
            throw error;
        }

        const pathsByCollection = new Map<string, string[]>();

        for (const row of data as unknown as CollectionCoverRow[]) {

            const path = row.recipe?.image_url

            if (!path) {continue;}    

            const existing = pathsByCollection.get(row.collection_id) ?? [];

            if (existing.length < 4) {
                existing.push(path);
                pathsByCollection.set(row.collection_id, existing);
            }
        }
        
return pathsByCollection;
}

type CollectionCoverRecipeRow = { recipe: { image_url: string | null } | null };

async function getCollectionCoverPathsForCollection(collectionId: string): Promise<string[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collection_recipes')
        .select('recipe:recipes(image_url)')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true })
        .limit(4);

    if (error) {
        throw error;
    }

    return (data as unknown as CollectionCoverRecipeRow[])
        .map((row) => row.recipe?.image_url)
        .filter((path): path is string => Boolean(path));
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
    if (paths.length === 0) {
        return {};
    }

    const supabase = createClient();

    const { data, error } = await supabase.storage
        .from('recipe-images')
        .createSignedUrls(paths, 60 * 60)

    if (error) {
        throw error;
    }

    const urlsByPath: Record<string, string> = {};

    for (const entry of data) {
        if (entry.path && entry.signedUrl) {
            urlsByPath[entry.path] = entry.signedUrl
        }
    }
    
return urlsByPath;
}

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

export async function getCollectionIdsForRecipe(recipeId: string): Promise<string[]> {
    const supabase = createClient();

    const { data, error } = await supabase.from('collection_recipes').select('collection_id').eq('recipe_id', recipeId);

    if (error) {
        throw error;
    }

    return data.map((row) => row.collection_id);
}

export async function addRecipeToCollection(collectionId: string, recipeId: string): Promise<void> {
    const supabase = createClient();

    const { data: lastRow, error: lastRowError } = await supabase
        .from('collection_recipes')
        .select('sort_order')
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastRowError) {
        throw lastRowError;
    }

    const { error } = await supabase
        .from('collection_recipes')
        .insert({ collection_id: collectionId, recipe_id: recipeId, sort_order: (lastRow?.sort_order ?? -1) + 1 });

    if (error) {
        throw error;
    }
}

export async function removeRecipeFromCollection(collectionId: string, recipeId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from('collection_recipes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('recipe_id', recipeId);

    if (error) {
        throw error;
    }
}

export type CreateCollectionInput = {
    name: string;
    description: string;
    recipeIds: string[];
    isPublic: boolean;
};

export async function createCollection(input: CreateCollectionInput): Promise<CollectionWithCount> {
    const supabase = createClient();

    const {
        data: { session }
    } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
        .from('collections')
        .insert({ name: input.name, description: input.description, user_id: user.id, is_public: input.isPublic })
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
    isPublic: boolean;
};

export async function updateCollection(input: UpdateCollectionInput): Promise<CollectionWithCount> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collections')
        .update({ name: input.name, description: input.description, is_public: input.isPublic })
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

    const { error } = await supabase.from('collections').delete().eq('id', id);

    if (error) {
        throw error;
    }
}
