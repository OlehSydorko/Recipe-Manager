export const ALLOWED_UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'Tbsp', 'cup', 'pinch', 'piece', 'Whole'] as const;

export type Unit = (typeof ALLOWED_UNITS)[number];

export const DEFAULT_UNIT: Unit = 'g';

export function isAllowedUnit(value: string): value is Unit {
    return (ALLOWED_UNITS as readonly string[]).includes(value);
}

export type Ingredient = {
    id: string;
    recipe_id: string;
    name: string;
    quantity: string | null;
    unit: string | null;
    sort_order: number;
    section_id: string | null;
};

export type IngredientDraft = {
    key: string;
    name: string;
    quantity: string;
    unit: string;
    sectionKey: string | null;
};
