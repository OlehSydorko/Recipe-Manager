import type { RecipeWithAuthor } from '@/types/recipe';
import { describe, expect, it } from 'vitest';
import { getDistinctCategoryNames } from './communityCategoryNames';

function buildRecipe(overrides: Partial<RecipeWithAuthor> = {}): RecipeWithAuthor {
    return {
        id: 'recipe-1',
        user_id: 'user-1',
        category_id: 'category-1',
        title: 'Test recipe',
        description: null,
        instructions: null,
        portions: 4,
        image_url: null,
        is_favorite: false,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        categoryName: null,
        author: { id: 'user-1', displayName: null, avatarUrl: null },
        ...overrides
    };
}

describe('getDistinctCategoryNames', () => {
    it('returns an empty array for no recipes', () => {
        expect(getDistinctCategoryNames([])).toEqual([]);
    });

    it('dedupes repeated category names', () => {
        const recipes = [
            buildRecipe({ id: '1', categoryName: 'Dinner' }),
            buildRecipe({ id: '2', categoryName: 'Dinner' }),
            buildRecipe({ id: '3', categoryName: 'Dessert' })
        ];

        expect(getDistinctCategoryNames(recipes)).toEqual(['Dessert', 'Dinner']);
    });

    it('sorts names alphabetically', () => {
        const recipes = [
            buildRecipe({ id: '1', categoryName: 'Snacks' }),
            buildRecipe({ id: '2', categoryName: 'Breakfast' })
        ];

        expect(getDistinctCategoryNames(recipes)).toEqual(['Breakfast', 'Snacks']);
    });

    it('skips recipes with no category name', () => {
        const recipes = [buildRecipe({ id: '1', categoryName: null }), buildRecipe({ id: '2', categoryName: 'Lunch' })];

        expect(getDistinctCategoryNames(recipes)).toEqual(['Lunch']);
    });
});
