import type { ExtractedRecipe } from '@/lib/recipeImport/schema';
import type { Category } from '@/types/category';
import { describe, expect, it } from 'vitest';
import { extractedToFormState } from './importedDraft';

const CATEGORIES: Category[] = [
    { id: 'cat-1', user_id: 'u1', name: 'Dessert', created_at: '2026-01-01' },
    { id: 'cat-2', user_id: 'u1', name: 'Breakfast', created_at: '2026-01-01' }
];

function baseExtracted(overrides: Partial<ExtractedRecipe> = {}): ExtractedRecipe {
    return {
        title: 'Pancakes',
        description: null,
        portions: null,
        categoryHint: null,
        sections: [],
        ingredients: [],
        steps: [],
        ...overrides
    };
}

describe('extractedToFormState', () => {
    it('matches an existing category case-insensitively', () => {
        const state = extractedToFormState(baseExtracted({ categoryHint: 'dessert' }), CATEGORIES);

        expect(state.categoryId).toBe('cat-1');
    });

    it('leaves categoryId blank when nothing matches, never auto-creating one', () => {
        const state = extractedToFormState(baseExtracted({ categoryHint: 'Soup' }), CATEGORIES);

        expect(state.categoryId).toBe('');
    });

    it('leaves categoryId blank when categoryHint is null', () => {
        const state = extractedToFormState(baseExtracted(), CATEGORIES);

        expect(state.categoryId).toBe('');
    });

    it('falls back to 1 portion when the model gave none', () => {
        const state = extractedToFormState(baseExtracted({ portions: null }), CATEGORIES);

        expect(state.portions).toBe(1);
    });

    it('builds one section per unique name and resolves ingredient/step section keys by name', () => {
        const extracted = baseExtracted({
            sections: ['Dough', 'Filling', 'dough'],
            ingredients: [
                { name: 'Flour', quantity: '2', unit: 'cup', section: 'Dough' },
                { name: 'Sugar', quantity: '1', unit: 'cup', section: 'filling' }
            ],
            steps: [{ instruction: 'Mix the dough.', section: 'Dough' }]
        });

        const state = extractedToFormState(extracted, CATEGORIES);

        expect(state.sections).toHaveLength(2);
        expect(state.sections.map((section) => section.name)).toEqual(['Dough', 'Filling']);

        const doughKey = state.sections.find((section) => section.name === 'Dough')?.key;
        const fillingKey = state.sections.find((section) => section.name === 'Filling')?.key;

        expect(state.ingredients[0].sectionKey).toBe(doughKey);
        expect(state.ingredients[1].sectionKey).toBe(fillingKey);
        expect(state.steps[0].sectionKey).toBe(doughKey);
    });

    it('leaves sectionKey null when an ingredient references a section not in extracted.sections', () => {
        const extracted = baseExtracted({
            sections: ['Dough'],
            ingredients: [{ name: 'Salt', quantity: null, unit: null, section: 'Topping' }]
        });

        const state = extractedToFormState(extracted, CATEGORIES);

        expect(state.ingredients[0].sectionKey).toBeNull();
    });

    it('falls back to DEFAULT_UNIT for a unit outside the allowed vocabulary', () => {
        const extracted = baseExtracted({
            ingredients: [{ name: 'Salt', quantity: 'a pinch', unit: 'cloves', section: null }]
        });

        const state = extractedToFormState(extracted, CATEGORIES);

        expect(state.ingredients[0].unit).toBe('g');
    });

    it('keeps a valid unit as-is', () => {
        const extracted = baseExtracted({
            ingredients: [{ name: 'Milk', quantity: '200', unit: 'ml', section: null }]
        });

        const state = extractedToFormState(extracted, CATEGORIES);

        expect(state.ingredients[0].unit).toBe('ml');
    });

    it('yields one empty ingredient/step row when the model returned none', () => {
        const state = extractedToFormState(baseExtracted(), CATEGORIES);

        expect(state.ingredients).toHaveLength(1);
        expect(state.ingredients[0].name).toBe('');
        expect(state.steps).toHaveLength(1);
        expect(state.steps[0].instruction).toBe('');
    });
});
