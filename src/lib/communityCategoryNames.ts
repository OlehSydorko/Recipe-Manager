import type { RecipeWithAuthor } from '@/types/recipe';

// Community recipes belong to other users, whose `categories` rows the
// viewer has no access to (categories are owner-scoped) — so the Community
// tab's filter chips are built from the distinct categoryName strings
// already present on the loaded community recipes, not from a categories
// table lookup.
export function getDistinctCategoryNames(recipes: RecipeWithAuthor[]): string[] {
    const names = new Set<string>();

    for (const recipe of recipes) {
        if (recipe.categoryName) {
            names.add(recipe.categoryName);
        }
    }

    return [...names].sort((a, b) => a.localeCompare(b));
}
