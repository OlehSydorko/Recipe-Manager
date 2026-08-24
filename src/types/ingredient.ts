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

// Local form-row shape used while editing a recipe's ingredient list.
// `key` is a stable React key (existing ingredient id, or a generated one for new rows)
// and is stripped out before the row is sent to the API. `sectionKey` points at a
// SectionDraft.key (see types/section.ts), or null for "no section" — resolved to a
// real section_id right before saving, once the sections themselves have been persisted.
export type IngredientDraft = {
    key: string;
    name: string;
    quantity: string;
    unit: string;
    sectionKey: string | null;
};
