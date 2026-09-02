import { planShoppingListAdditions } from '@/lib/shoppingListMerge';
import type { ShoppingListItem } from '@/types/shoppingListItem';
import { describe, expect, it } from 'vitest';

function makeExistingItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
    return {
        created_at: '2026-01-01T00:00:00.000Z',
        id: 'existing-1',
        is_checked: false,
        name: 'Onion',
        quantity: '2',
        section: 'produce',
        sort_order: 0,
        source_recipe_id: null,
        unit: 'pcs',
        updated_at: '2026-01-01T00:00:00.000Z',
        user_id: 'user-1',
        ...overrides
    };
}

describe('planShoppingListAdditions', () => {
    it('inserts an item with no name+unit match', () => {
        const plan = planShoppingListAdditions(
            [makeExistingItem()],
            [{ name: 'Garlic', quantity: '4', section: 'produce', sourceRecipeId: null, unit: 'pcs' }]
        );

        expect(plan.toInsert).toHaveLength(1);
        expect(plan.toUpdate).toHaveLength(0);
    });

    it('sums quantities when name and unit match (case-insensitive)', () => {
        const plan = planShoppingListAdditions(
            [makeExistingItem({ quantity: '2', unit: 'pcs' })],
            [{ name: 'onion', quantity: '3', section: 'produce', sourceRecipeId: null, unit: 'PCS' }]
        );

        expect(plan.toInsert).toHaveLength(0);
        expect(plan.toUpdate).toEqual([{ id: 'existing-1', is_checked: false, quantity: '5' }]);
    });

    it('un-checks the merged row so it reappears as remaining', () => {
        const plan = planShoppingListAdditions(
            [makeExistingItem({ is_checked: true })],
            [{ name: 'Onion', quantity: '1', section: 'produce', sourceRecipeId: null, unit: 'pcs' }]
        );

        expect(plan.toUpdate[0]?.is_checked).toBe(false);
    });

    it('falls back to a separate line when units differ', () => {
        const plan = planShoppingListAdditions(
            [makeExistingItem({ quantity: '2', unit: 'pcs' })],
            [{ name: 'Onion', quantity: '800', section: 'produce', sourceRecipeId: null, unit: 'g' }]
        );

        expect(plan.toInsert).toHaveLength(1);
        expect(plan.toUpdate).toHaveLength(0);
    });

    it('falls back to a separate line when a quantity is not a plain number', () => {
        const plan = planShoppingListAdditions(
            [makeExistingItem({ quantity: '2', unit: 'pcs' })],
            [{ name: 'Onion', quantity: 'a pinch', section: 'produce', sourceRecipeId: null, unit: 'pcs' }]
        );

        expect(plan.toInsert).toHaveLength(1);
        expect(plan.toUpdate).toHaveLength(0);
    });

    it('merges two incoming items with each other, not just against the existing list', () => {
        const plan = planShoppingListAdditions(
            [],
            [
                { name: 'Onion', quantity: '1', section: 'produce', sourceRecipeId: 'recipe-a', unit: 'pcs' },
                { name: 'Onion', quantity: '2', section: 'produce', sourceRecipeId: 'recipe-b', unit: 'pcs' }
            ]
        );

        expect(plan.toInsert).toHaveLength(1);
        expect(plan.toInsert[0]?.quantity).toBe('3');
        expect(plan.toUpdate).toHaveLength(0);
    });
});
