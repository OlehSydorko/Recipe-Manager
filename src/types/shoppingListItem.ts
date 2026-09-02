export const SHOPPING_SECTIONS = [
    'produce',
    'meat_fish',
    'dairy_eggs',
    'bakery',
    'pantry',
    'frozen',
    'beverages',
    'spices_sauces',
    'household',
    'other'
] as const;

export type ShoppingSection = (typeof SHOPPING_SECTIONS)[number];

export const DEFAULT_SHOPPING_SECTION: ShoppingSection = 'other';

export const SHOPPING_SECTION_LABELS: Record<ShoppingSection, string> = {
    produce: 'Fruits & Vegetables',
    meat_fish: 'Meat & Fish',
    dairy_eggs: 'Dairy & Eggs',
    bakery: 'Bakery',
    pantry: 'Pantry',
    frozen: 'Frozen',
    beverages: 'Beverages',
    spices_sauces: 'Spices & Sauces',
    household: 'Household',
    other: 'Other'
};

export function isAllowedShoppingSection(value: string): value is ShoppingSection {
    return (SHOPPING_SECTIONS as readonly string[]).includes(value);
}

export type ShoppingListItem = {
    id: string;
    user_id: string;
    name: string;
    quantity: string | null;
    unit: string | null;
    section: ShoppingSection;
    is_checked: boolean;
    source_recipe_id: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
};

export type ShoppingListItemDraft = {
    name: string;
    quantity: string;
    unit: string;
    section: ShoppingSection;
};
