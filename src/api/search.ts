import { searchProfiles } from '@/api/profiles';
import { createClient } from '@/lib/supabaseClient';
import type { Profile } from '@/types/profile';

const SUGGESTION_LIMIT = 5;

export type RecipeSuggestion = {
    id: string;
    title: string;
};

export type CollectionSuggestion = {
    id: string;
    name: string;
};

export type GlobalSearchResults = {
    recipes: RecipeSuggestion[];
    collections: CollectionSuggestion[];
    people: Profile[];
};

export async function searchRecipesByTitle(query: string): Promise<RecipeSuggestion[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('recipes')
        .select('id, title')
        .ilike('title', `%${query}%`)
        .limit(SUGGESTION_LIMIT);

    if (error) {
        throw error;
    }

    return data;
}

export async function searchCollectionsByName(query: string): Promise<CollectionSuggestion[]> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('collections')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(SUGGESTION_LIMIT);

    if (error) {
        throw error;
    }

    return data;
}

export async function searchAll(query: string, excludeUserId?: string): Promise<GlobalSearchResults> {
    const [recipes, collections, people] = await Promise.all([
        searchRecipesByTitle(query),
        searchCollectionsByName(query),
        searchProfiles(query, excludeUserId)
    ]);

    return {
        recipes,
        collections,
        people: people.slice(0, SUGGESTION_LIMIT)
    };
}
