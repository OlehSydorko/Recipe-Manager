import { describe, expect, it } from 'vitest';
import { isFormDirty } from './formDirty';

describe('isFormDirty', () => {
    it('is never dirty while the baseline has not loaded', () => {
        expect(isFormDirty(null, { title: 'Anything' })).toBe(false);
    });

    it('is not dirty when current matches the baseline', () => {
        const initial = { title: 'Pancakes' };

        expect(isFormDirty(initial, { title: 'Pancakes' })).toBe(false);
    });

    it('is dirty when current differs from the baseline', () => {
        const initial = { title: 'Pancakes' };

        expect(isFormDirty(initial, { title: 'Waffles' })).toBe(true);
    });

    it('detects changes in nested fields', () => {
        const initial = { ingredients: [{ name: 'Flour' }] };
        const current = { ingredients: [{ name: 'Sugar' }] };

        expect(isFormDirty(initial, current)).toBe(true);
    });
});
