export type Ingredient = {
    id: string;
    recipe_id: string;
    name: string;
    quantity: string | null;
    unit: string | null;
    sort_order: number;
};

// Local form-row shape used while editing a recipe's ingredient list.
// `key` is a stable React key (existing ingredient id, or a generated one for new rows)
// and is stripped out before the row is sent to the API.
export type IngredientDraft = {
    key: string;
    name: string;
    quantity: string;
    unit: string;
};
