import { groupByShoppingSection } from '@/lib/shoppingListGrouping';
import type { ShoppingListItem } from '@/types/shoppingListItem';
import { describe, expect, it } from 'vitest';

function makeItem(overrides: Partial<ShoppingListItem> = {}): ShoppingListItem {
    return {
        created_at: '2026-01-01T00:00:00.000Z',
        id: 'item-1',
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

describe('groupByShoppingSection', () => {
    it('returns no groups for an empty list', () => {
        expect(groupByShoppingSection([])).toEqual([]);
    });

    it('skips sections with no items', () => {
        const groups = groupByShoppingSection([makeItem({ section: 'pantry' })]);

        expect(groups).toHaveLength(1);
        expect(groups[0]).toEqual({
            items: [expect.objectContaining({ section: 'pantry' })],
            label: 'Pantry',
            section: 'pantry'
        });
    });

    it('orders groups by the canonical section order, not insertion order', () => {
        const groups = groupByShoppingSection([makeItem({ section: 'other' }), makeItem({ section: 'produce' })]);

        expect(groups.map((group) => group.section)).toEqual(['produce', 'other']);
    });

    it('keeps multiple items together within a section', () => {
        const groups = groupByShoppingSection([
            makeItem({ id: 'a', section: 'dairy_eggs' }),
            makeItem({ id: 'b', section: 'dairy_eggs' })
        ]);

        expect(groups).toHaveLength(1);
        expect(groups[0]?.items.map((item) => item.id)).toEqual(['a', 'b']);
    });
});
