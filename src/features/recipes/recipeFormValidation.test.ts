import { describe, expect, it } from 'vitest';
import { firstInvalidFieldId, hasFormErrors, validateRecipeForm } from './recipeFormValidation';

describe('validateRecipeForm', () => {
    it('returns no errors when everything is filled in', () => {
        const errors = validateRecipeForm({ title: 'Pancakes', categoryId: 'cat-1', portions: 4 });

        expect(errors).toEqual({ title: '', categoryId: '', portions: '' });
        expect(hasFormErrors(errors)).toBe(false);
    });

    it('flags a blank title, including whitespace-only', () => {
        expect(validateRecipeForm({ title: '', categoryId: 'cat-1', portions: 4 }).title).not.toBe('');
        expect(validateRecipeForm({ title: '   ', categoryId: 'cat-1', portions: 4 }).title).not.toBe('');
    });

    it('flags a missing category', () => {
        const errors = validateRecipeForm({ title: 'Pancakes', categoryId: '', portions: 4 });

        expect(errors.categoryId).not.toBe('');
    });

    it('flags zero and empty-string portions', () => {
        expect(validateRecipeForm({ title: 'Pancakes', categoryId: 'cat-1', portions: 0 }).portions).not.toBe('');
        expect(validateRecipeForm({ title: 'Pancakes', categoryId: 'cat-1', portions: '' }).portions).not.toBe('');
    });

    it('flags all three at once', () => {
        const errors = validateRecipeForm({ title: '', categoryId: '', portions: '' });

        expect(hasFormErrors(errors)).toBe(true);
        expect(errors.title).not.toBe('');
        expect(errors.categoryId).not.toBe('');
        expect(errors.portions).not.toBe('');
    });
});

describe('firstInvalidFieldId', () => {
    it('returns null when there are no errors', () => {
        expect(firstInvalidFieldId({ title: '', categoryId: '', portions: '' })).toBeNull();
    });

    it('prefers title, then category, then portions, in form order', () => {
        expect(firstInvalidFieldId({ title: '', categoryId: '', portions: '' })).toBeNull();
        expect(firstInvalidFieldId({ title: '', categoryId: 'missing category', portions: '' })).toBe('category');
        expect(firstInvalidFieldId({ title: 'missing title', categoryId: '', portions: '' })).toBe('title');
        expect(
            firstInvalidFieldId({ title: 'missing title', categoryId: 'missing category', portions: '' })
        ).toBe('title');
        expect(firstInvalidFieldId({ title: '', categoryId: '', portions: 'missing portions' })).toBe('portions');
    });
});
