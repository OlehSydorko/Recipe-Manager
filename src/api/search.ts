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

// Title match only, capped to a handful of suggestions -- recipes are
// public-read (see public_recipe_read_access migration), so this returns
// matches across every user, not just the caller's own.
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

// Name match only, capped to a handful of suggestions. No explicit
// visibility filter is needed -- unlike getCollections() (which scopes to
// "my collections" for the My Collections page), this deliberately leaves
// visibility to RLS (is_public = true OR user_id = auth.uid()), the same
// pattern getCollection() already relies on, so a guest or another user only
// ever sees collections they're allowed to see.
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

// Backs the global nav search dropdown -- fans out to recipes, collections,
// and people in parallel. excludeUserId is forwarded to searchProfiles so the
// caller doesn't see themselves in their own "People" suggestions.
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
