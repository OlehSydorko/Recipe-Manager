export type RecipeFormErrors = {
    title: string;
    categoryId: string;
    portions: string;
};

export function validateRecipeForm(values: {
    title: string;
    categoryId: string;
    portions: number | '';
}): RecipeFormErrors {
    return {
        title: values.title.trim() ? '' : 'Oops, a recipe needs a title.',
        categoryId: values.categoryId ? '' : 'Oops, pick a category.',
        portions: values.portions ? '' : 'Oops, you cannot have 0 portions.'
    };
}

export function hasFormErrors(errors: RecipeFormErrors): boolean {
    return Boolean(errors.title || errors.categoryId || errors.portions);
}

export function firstInvalidFieldId(errors: RecipeFormErrors): string | null {
    if (errors.title) {
        return 'title';
    }

    if (errors.categoryId) {
        return 'category';
    }

    if (errors.portions) {
        return 'portions';
    }

    return null;
}
